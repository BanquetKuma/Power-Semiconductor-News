# scripts/build_news.py
import os, re, json, time, math, hashlib, html
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

import requests
import feedparser
import tldextract
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
import trafilatura
import csv
from pathlib import Path

JST = timezone(timedelta(hours=9))
FAST_MODE = os.getenv('NEWS_FAST_MODE') == '1'
try:
    GLOBAL_TIMEOUT_SEC = int(os.getenv('NEWS_GLOBAL_TIMEOUT_SEC', '60'))
except Exception:
    GLOBAL_TIMEOUT_SEC = 60
ROOT = os.path.dirname(os.path.dirname(__file__))
NEWS_DIR = os.path.join(ROOT, 'news')
SOURCES_YAML = os.path.join(ROOT, 'sources.yaml')

# --- utils -------------------------------------------------

def log(*a):
    print('[build]', *a, flush=True)

def canon_url(u: str) -> str:
    try:
        p = urlparse(u)
        # パラメータのutm等を削除
        q = [(k,v) for k,v in parse_qsl(p.query) if not k.lower().startswith('utm_')]
        # 末尾スラッシュと #frag を除去
        p = p._replace(query=urlencode(q), fragment='')
        s = urlunparse(p)
        if s.endswith('/'):
            s = s[:-1]
        return s
    except Exception:
        return u

SIM_THRESHOLD = 0.95  # 類似判定を厳しめにして間引き過多を抑制

from difflib import SequenceMatcher

def very_similar(a,b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= SIM_THRESHOLD

UA = {
    # Modern UA to avoid Google Docs "browser not supported" fences
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/csv,application/csv,text/plain;q=0.9,*/*;q=0.8'
}

# --- sources ----------------------------------------------

def load_sources():
    import yaml
    with open(SOURCES_YAML, 'r', encoding='utf-8') as f:
        y = yaml.safe_load(f)
    return (
        y.get('feeds', []),
        y.get('x_accounts', []),
        y.get('x_rss_base'),
        y.get('x_rss_accounts', []),
        y.get('sheets', [])
    )

# --- fetch -------------------------------------------------

def head_ok(url: str) -> bool:
    try:
        # 一部SNS/大手はHEAD拒否が多い→許可ドメインは常にTrue
        host = urlparse(url).netloc.lower()
        allow_hosts = ['x.com', 'twitter.com', 'nitter.net']
        if any(h == host or host.endswith('.'+h) for h in allow_hosts):
            return True
        if FAST_MODE:
            return True
        r = requests.head(url, headers=UA, timeout=8, allow_redirects=True)
        if r.status_code >= 400:
            # 一部サイトはHEAD拒否 → GETで再確認
            r = requests.get(url, headers=UA, timeout=10, allow_redirects=True)
        return 200 <= r.status_code < 400
    except Exception:
        return False


def fetch_feed(url: str):
    log('feed:', url)
    d = None
    try:
        if FAST_MODE:
            rr = requests.get(url, headers=UA, timeout=8)
            rr.raise_for_status()
            d = feedparser.parse(rr.text)
        else:
            rr = requests.get(url, headers=UA, timeout=15)
            rr.raise_for_status()
            d = feedparser.parse(rr.text)
    except Exception:
        # フォールバック: feedparserにURLを直接渡す（内部で取得）
        try:
            d = feedparser.parse(url)
        except Exception:
            d = {'entries': []}
    if not d:
        d = {'entries': []}
    items = []
    for e in d.entries:
        title = e.get('title', '').strip()
        link = e.get('link') or e.get('id')
        if not title or not link:
            continue
        link = canon_url(link)
        # pubdate
        dt = None
        for key in ['published', 'updated', 'created']:
            if e.get(key):
                try:
                    dt = dateparser.parse(e.get(key))
                    break
                except Exception:
                    pass
        if not dt:
            dt = datetime.now(timezone.utc)
        # summary
        summary = BeautifulSoup(e.get('summary', ''), 'html.parser').get_text(' ', strip=True)
        items.append({
            'title': title,
            'url': link,
            'summary': summary,
            'published': dt.astimezone(JST).isoformat(),
            'source_name': tldextract.extract(link).registered_domain or urlparse(link).netloc,
        })
    return items


def fetch_x_api(usernames):
    token = os.getenv('X_BEARER_TOKEN')
    if not token:
        if usernames:
            log('X API: X_BEARER_TOKEN not set, skipping X/Twitter API')
        return []
    if not usernames:
        return []
    log('x api: users', usernames)
    headers = {
        'Authorization': f'Bearer {token}',
        'User-Agent': UA['User-Agent']
    }
    out = []
    for name in usernames:
        try:
            u = requests.get(f'https://api.x.com/2/users/by/username/{name}', headers=headers, timeout=10).json()
            uid = u.get('data',{}).get('id')
            display = u.get('data',{}).get('name')
            if not uid:
                continue
            t = requests.get(
                f'https://api.x.com/2/users/{uid}/tweets',
                params={'max_results': 10, 'tweet.fields': 'created_at'},
                headers=headers, timeout=10
            ).json()
            for tw in t.get('data', []):
                url = f'https://x.com/{name}/status/{tw.get("id")}'
                out.append({
                    'title': (tw.get('text') or '').split('\n')[0][:90],
                    'url': url,
                    'summary': tw.get('text') or '',
                    'published': dateparser.parse(tw.get('created_at')).astimezone(JST).isoformat(),
                    'source_name': 'x.com',
                    'author_handle': name,
                    'author_display': display
                })
        except Exception as ex:
            log('x api error', name, ex)
    return out


def fetch_x_rss(base, accounts):
    if not base or not accounts:
        return []
    out = []
    for name in accounts:
        url = f"{base.rstrip('/')}/{name}/rss"
        try:
            for e in fetch_feed(url):
                # NitterのリンクをX公式に正規化
                e['url'] = re.sub(r'^https?://[^/]+/([^/]+)/status/(\d+).*', r'https://x.com/\1/status/\2', e['url'])
                e['source_name'] = 'x.com'
                e['author_handle'] = name
                out.append(e)
        except Exception as ex:
            log('x rss error', name, ex)
    return out

# --- google sheets -----------------------------------------

def fetch_google_sheet_csv(sheet_id: str, gid: str|int = 0, timeout_sec: int = 20):
    # Try several export endpoints to bypass occasional HTML fences
    urls = [
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}",
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?gid={gid}&single=true&output=csv",
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&gid={gid}"
    ]
    last_err = None
    for url in urls:
        log('sheet:', url)
        try:
            r = requests.get(url, headers=UA, timeout=timeout_sec, allow_redirects=True)
            r.raise_for_status()
            ctype = (r.headers.get('Content-Type') or '').lower()
            if 'text/html' in ctype and 'csv' not in ctype:
                # likely a consent or unsupported-page; try next
                continue
            r.encoding = 'utf-8'
            text = r.text
            rows = [row for row in csv.reader(text.splitlines())]
            # Heuristic: at least 1 non-empty row with a URL-like cell
            if any(any(('http://' in cell or 'https://' in cell) for cell in row) for row in rows):
                return rows
        except Exception as ex:
            last_err = ex
            continue
    if last_err:
        log('sheet err', last_err)
    return []


def rows_to_items_from_sheet(rows, mapping=None):
    # mapping: dict with keys: date, handle, text, url. Values are column indices (0-based)
    # default assumes: A=date(0) B=handle(1) D=text(3) F=url(5)
    m = mapping or {'date': 0, 'handle': 1, 'text': 3, 'url': 5}
    out = []
    for r in rows:
        try:
            dt_raw = (r[m['date']] if len(r) > m['date'] else '').strip()
            handle = (r[m['handle']] if len(r) > m['handle'] else '').strip()
            text = (r[m['text']] if len(r) > m['text'] else '').strip()
            url = canon_url((r[m['url']] if len(r) > m['url'] else '').strip())
            if not text or not url:
                continue
            # parse date
            dt = None
            if dt_raw:
                try:
                    dt = dateparser.parse(dt_raw)
                except Exception:
                    dt = None
            if not dt:
                dt = datetime.now(timezone.utc)
            src_name = 'x.com' if 'x.com/' in url or 'twitter.com/' in url else tldextract.extract(url).registered_domain
            out.append({
                'title': text.split('\n')[0][:90],
                'url': url,
                'summary': text,
                'published': dt.astimezone(JST).isoformat(),
                'source_name': src_name or 'sheet',
                'author_handle': handle.lstrip() if handle else ''
            })
        except Exception:
            continue
    return out


def load_manual_sns(path: str|Path):
    p = Path(path)
    if not p.exists():
        return []
    text = p.read_text(encoding='utf-8')
    # TSV: date\thandle\ttext\tmedia_url(optional)\tpost_url
    rows = []
    for line in text.splitlines():
        if not line.strip():
            continue
        parts = line.split('\t')
        # fill to 5 columns
        while len(parts) < 5:
            parts.append('')
        rows.append(parts)
    return rows

# --- extraction -------------------------------------------

def extract_text(url: str) -> str:
    try:
        if FAST_MODE:
            return ''
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return ''
        txt = trafilatura.extract(downloaded, include_comments=False, include_images=False, include_tables=False) or ''
        return txt.strip()
    except Exception:
        return ''

# --- heuristics & scoring --------------------------------
KEYWORDS_ENGINEER = r"\b(API|SDK|CLI|ライブラリ|GitHub|オープンソース|weights|モデル|fine-tune|benchmark|データセット|リリース|v\d(?:\.\d)?)\b"
KEYWORDS_BIZ = r"\b(Copilot|Notion|Slack|Google\s?Workspace|Microsoft\s?365|Salesforce|HubSpot|自動化|ワークフロー|生産性|アシスタント)\b"
KEYWORDS_POLICY = r"\b(EU\s?AI\s?Act|規制|法案|大統領令|省令|罰金|当局|安全性評価|監査)\b"

# --- 半導体分野キーワード（4分類） ---
# Note: 日本語対応のため \b（単語境界）は英単語のみに適用し、日本語キーワードは直接マッチ

# 1. デバイスの種類
# Note: 英字略語は (?<![A-Za-z]) と (?![A-Za-z]) で囲み、日本語文字との境界でもマッチするようにする
KEYWORDS_LOGIC = r"((?<![A-Za-z])CPU(?![A-Za-z])|(?<![A-Za-z])GPU(?![A-Za-z])|(?<![A-Za-z])FPGA(?![A-Za-z])|(?<![A-Za-z])ASIC(?![A-Za-z])|ロジック半導体|\blogic semiconductor\b|プロセッサ|\bprocessor\b|(?<![A-Za-z])SoC(?![A-Za-z])|(?<![A-Za-z])NPU(?![A-Za-z])|(?<![A-Za-z])TPU(?![A-Za-z])|アクセラレータ|\baccelerator\b)"
KEYWORDS_MEMORY = r"((?<![A-Za-z])DRAM(?![A-Za-z])|(?<![A-Za-z])NAND(?![A-Za-z])|フラッシュ|\bflash\b|(?<![A-Za-z])HBM(?![A-Za-z])|高帯域幅メモリ|メモリ半導体|\bmemory chip\b|(?<![A-Za-z])SRAM(?![A-Za-z])|(?<![A-Za-z])DDR(?![A-Za-z0-9])|(?<![A-Za-z])LPDDR(?![A-Za-z0-9]))"
KEYWORDS_POWER = r"((?<![A-Za-z])SiC(?![A-Za-z])|炭化ケイ素|(?<![A-Za-z])GaN(?![A-Za-z])|窒化ガリウム|(?<![A-Za-z])IGBT(?![A-Za-z])|(?<![A-Za-z])MOSFET(?![A-Za-z])|パワー半導体|\bpower semiconductor\b|ワイドバンドギャップ|\bwide bandgap\b|ゲートドライバ|\bgate driver\b|インバータ|\binverter\b|電力変換)"
KEYWORDS_ANALOG = r"(センサ|\bsensor\b|(?<![A-Za-z])PMIC(?![A-Za-z])|電源管理|アナログ半導体|\banalog semiconductor\b|オペアンプ|(?<![A-Za-z])ADC(?![A-Za-z])|(?<![A-Za-z])DAC(?![A-Za-z])|信号処理)"
KEYWORDS_IMAGE = r"((?<![A-Za-z])CMOS[Ss]ensor|CMOSセンサ|イメージセンサ|\bimage sensor\b|(?<![A-Za-z])CCD(?![A-Za-z]))"

# 2. 製造工程・技術
KEYWORDS_FRONTEND = r"(露光|\blithography\b|エッチング|\betching\b|成膜|\bdeposition\b|\bCVD\b|\bPVD\b|洗浄|\bcleaning\b|フォトレジスト|\bphotoresist\b)"
KEYWORDS_BACKEND = r"(チップレット|\bchiplet\b|先端パッケージング|\badvanced packaging\b|2\.5D|3D実装|\bCoWoS\b|\bEMIB\b|\bHI\b|\bInFO\b|ボンディング|\bbonding\b|ダイシング)"
KEYWORDS_MINIATURIZATION = r"(\b2nm\b|\b3nm\b|\b5nm\b|\b7nm\b|\bGAA\b|\bGate-All-Around\b|\bFinFET\b|微細化|\badvanced node\b|最先端プロセス)"
KEYWORDS_EQUIPMENT = r"(\bEUV\b|極端紫外線|ナノインプリント|製造装置|\bsemiconductor equipment\b|スキャナ|\bstepper\b|検査装置|計測装置)"
KEYWORDS_WAFER = r"(シリコンウェーハ|\bsilicon wafer\b|ウェーハ|\bwafer\b|化合物半導体|\bcompound semiconductor\b|エピタキシャル)"

# 3. 市場・アプリケーション
KEYWORDS_AI_CHIP = r"(AI半導体|\bAI chip\b|AIチップ|アクセラレータ|エッジAI|\bedge AI\b|AIサーバ|\bAI server\b)"
KEYWORDS_AUTOMOTIVE = r"(車載半導体|\bautomotive semiconductor\b|自動運転|\bautonomous\b|\bADAS\b|先進運転支援|\bEV\b|電気自動車|\bxEV\b)"
KEYWORDS_DATACENTER = r"(データセンター|\bdata center\b|サーバ用|\bserver\b|クラウド|\bcloud\b|ハイパースケーラ|\bhyperscaler\b)"
KEYWORDS_INDUSTRIAL = r"(産業機器|\bindustrial\b|スマートファクトリー|\bsmart factory\b|\bIoT\b|\bFA\b|工場自動化)"

# 4. 業界構造・地政学
KEYWORDS_FOUNDRY = r"(ファウンドリ|\bfoundry\b|受託製造|\bTSMC\b|\bSamsung Foundry\b|\bIntel Foundry\b|\bRapidus\b|ラピダス|\bGlobalFoundries\b|\bUMC\b|\bSMIC\b)"
KEYWORDS_FABLESS = r"(ファブレス|\bfabless\b|\bNVIDIA\b|\bApple\b|\bQualcomm\b|\bAMD\b|\bMediaTek\b|\bBroadcom\b|設計専門)"
KEYWORDS_IDM = r"(\bIDM\b|\bIntel\b|\bMicron\b|\bSamsung\b|\bSK Hynix\b|垂直統合|自社工場)"
KEYWORDS_GEOPOLITICS = r"(CHIPS法|\bCHIPS Act\b|輸出規制|\bexport control\b|経済安全保障|サプライチェーン|\bsupply chain\b|脱中国|デカップリング)"

# 半導体全般（フォールバック）
KEYWORDS_SEMI_GENERAL = r"(半導体|\bsemiconductor\b|\bchip\b|チップ|\bfab\b|製造|シリコン|\bsilicon\b)"

# 分野ラベルの日本語マッピング
FIELD_LABELS = {
    'power': 'パワー半導体',
    'memory': 'メモリ半導体',
    'logic': 'ロジック半導体',
    'analog': 'アナログ半導体',
    'image': 'イメージセンサ',
    'ai': 'AI半導体',
    'automotive': '車載半導体',
    'datacenter': 'データセンター',
    'industrial': '産業機器',
    'foundry': 'ファウンドリ',
    'fabless': 'ファブレス',
    'idm': 'IDM',
    'geopolitics': '地政学・規制',
    'frontend': '前工程',
    'backend': '後工程',
    'miniaturization': '微細化',
    'equipment': '製造装置',
    'wafer': 'ウェーハ',
    'general': '半導体全般'
}
BIG_NAMES = [
    'OpenAI','Anthropic','Google','DeepMind','Microsoft','Meta','NVIDIA','Amazon','Apple','xAI','Mistral','Hugging Face'
]


def classify(item):
    title = (item.get('title') or '')
    s = (item.get('summary') or '')
    text = f"{title} {s}"
    cat = []
    if re.search(KEYWORDS_ENGINEER, text, re.I):
        cat.append('tools')
    if re.search(KEYWORDS_BIZ, text, re.I):
        cat.append('business')
    if any(n.lower() in text.lower() for n in BIG_NAMES) or re.search(KEYWORDS_POLICY, text, re.I):
        cat.append('company')
    if 'x.com' in (item.get('source_name') or '') or 'twitter' in (item.get('source_name') or ''):
        cat.append('sns')
    if not cat:
        # デフォルトは company
        cat = ['company']
    return cat


def classify_field(item) -> dict:
    """記事を半導体分野で分類（4分類）
    Returns: {'primary': str, 'device': str|None, 'process': str|None, 'market': str|None, 'industry': str|None}
    または半導体関連でない場合は None
    """
    text = f"{item.get('title', '')} {item.get('summary', '')}"
    result = {'primary': None, 'device': None, 'process': None, 'market': None, 'industry': None}

    # デバイス種類
    if re.search(KEYWORDS_POWER, text, re.I):
        result['device'] = 'power'
    elif re.search(KEYWORDS_MEMORY, text, re.I):
        result['device'] = 'memory'
    elif re.search(KEYWORDS_LOGIC, text, re.I):
        result['device'] = 'logic'
    elif re.search(KEYWORDS_ANALOG, text, re.I):
        result['device'] = 'analog'
    elif re.search(KEYWORDS_IMAGE, text, re.I):
        result['device'] = 'image'

    # 製造工程
    if re.search(KEYWORDS_BACKEND, text, re.I):
        result['process'] = 'backend'
    elif re.search(KEYWORDS_FRONTEND, text, re.I):
        result['process'] = 'frontend'
    elif re.search(KEYWORDS_MINIATURIZATION, text, re.I):
        result['process'] = 'miniaturization'
    elif re.search(KEYWORDS_EQUIPMENT, text, re.I):
        result['process'] = 'equipment'
    elif re.search(KEYWORDS_WAFER, text, re.I):
        result['process'] = 'wafer'

    # 市場用途
    if re.search(KEYWORDS_AI_CHIP, text, re.I):
        result['market'] = 'ai'
    elif re.search(KEYWORDS_AUTOMOTIVE, text, re.I):
        result['market'] = 'automotive'
    elif re.search(KEYWORDS_DATACENTER, text, re.I):
        result['market'] = 'datacenter'
    elif re.search(KEYWORDS_INDUSTRIAL, text, re.I):
        result['market'] = 'industrial'

    # 業界構造
    if re.search(KEYWORDS_FOUNDRY, text, re.I):
        result['industry'] = 'foundry'
    elif re.search(KEYWORDS_FABLESS, text, re.I):
        result['industry'] = 'fabless'
    elif re.search(KEYWORDS_IDM, text, re.I):
        result['industry'] = 'idm'
    elif re.search(KEYWORDS_GEOPOLITICS, text, re.I):
        result['industry'] = 'geopolitics'

    # プライマリ分類の決定（優先順位: device > market > industry > process）
    result['primary'] = result['device'] or result['market'] or result['industry'] or result['process']

    # 半導体全般チェック（他の分類がない場合）
    if not result['primary'] and re.search(KEYWORDS_SEMI_GENERAL, text, re.I):
        result['primary'] = 'general'

    return result if result['primary'] else None


def score(item):
    now = datetime.now(JST)
    try:
        dt = dateparser.parse(item.get('published')).astimezone(JST)
    except Exception:
        dt = now
    age_h = (now - dt).total_seconds()/3600
    # 情報量拡充のため新しさウィンドウを可変に（デフォルト96h）
    try:
        rec_hours = float(os.getenv('NEWS_RECENCY_WINDOW_HOURS', '96'))
    except Exception:
        rec_hours = 96.0
    recency = max(0.0, 1.0 - min(age_h/rec_hours, 1.0))

    t = (item.get('title') or '') + ' ' + (item.get('summary') or '')
    engineer = 1.0 if re.search(KEYWORDS_ENGINEER, t, re.I) else 0.0
    biz = 1.0 if re.search(KEYWORDS_BIZ, t, re.I) else 0.0
    policy = 1.0 if re.search(KEYWORDS_POLICY, t, re.I) else 0.0
    big = 1.0 if any(n.lower() in t.lower() for n in BIG_NAMES) else 0.0

    # サプライズ（脆弱性/大型発表/劇的比較などの単語）
    surprise = 1.0 if re.search(r"(突破|leak|爆|倍|破る|破竹|unprecedented|重大|障害|停止|重大脆弱性|過去最大)", t, re.I) else 0.0

    base = 0.4*recency + 0.25*surprise + 0.2*big + 0.1*engineer + 0.05*(biz or policy)
    # 星（1〜5）
    stars = 1 + int(round(base*4))
    return base, min(max(stars,1),5)

# --- LLM summarization (optional) -------------------------
# Priority: GOOGLE_API_KEY (Gemini, cheaper) > OPENAI_API_KEY

_llm_warned = False

def _build_prompt(title, text, url):
    return f"""以下の記事を日本語で80文字以内に要約し、カテゴリ（business/tools/company/snsのいずれか）と、重要度を1〜5で出してください。出力はJSONのみ。

タイトル: {title}
URL: {url}
本文: {text[:4000]}"""

def _parse_llm_response(ans):
    """Parse LLM response JSON"""
    # Remove markdown code blocks if present
    ans = ans.strip()
    if ans.startswith('```'):
        ans = '\n'.join(ans.split('\n')[1:])
    if ans.endswith('```'):
        ans = ans.rsplit('```', 1)[0]
    ans = ans.strip()
    j = json.loads(ans)
    return {
        'blurb': j.get('summary') or j.get('要約') or j.get('blurb'),
        'category': j.get('category') or j.get('カテゴリ'),
        'stars': int(j.get('stars') or j.get('重要度') or 3)
    }

def _llm_gemini(title, text, url):
    """Gemini API (gemini-2.5-flash-lite)"""
    key = os.getenv('GOOGLE_API_KEY')
    model = os.getenv('GEMINI_MODEL') or 'gemini-2.5-flash-lite'
    prompt = _build_prompt(title, text, url)

    payload = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.2,
            'responseMimeType': 'application/json'
        },
        'systemInstruction': {'parts': [{'text': 'You are a concise Japanese news assistant. Output JSON only.'}]}
    }

    r = requests.post(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}',
        json=payload,
        timeout=45
    )
    r.raise_for_status()
    ans = r.json()['candidates'][0]['content']['parts'][0]['text']
    return _parse_llm_response(ans)

def _llm_openai(title, text, url):
    """OpenAI API (gpt-4o-mini)"""
    key = os.getenv('OPENAI_API_KEY')
    model = os.getenv('OPENAI_MODEL') or 'gpt-4o-mini'
    base = os.getenv('OPENAI_API_BASE') or 'https://api.openai.com/v1'
    prompt = _build_prompt(title, text, url)

    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a concise Japanese news assistant.'},
            {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.2
    }
    r = requests.post(f'{base}/chat/completions', headers={'Authorization': f'Bearer {key}'}, json=payload, timeout=45)
    r.raise_for_status()
    ans = r.json()['choices'][0]['message']['content']
    return _parse_llm_response(ans)

def llm_summarize(title, text, url):
    global _llm_warned

    google_key = os.getenv('GOOGLE_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')

    if not google_key and not openai_key:
        if not _llm_warned:
            log('LLM: No API key set (GOOGLE_API_KEY or OPENAI_API_KEY), using RSS/feed summaries')
            _llm_warned = True
        return None

    # Try Gemini first (cheaper), fall back to OpenAI
    if google_key:
        try:
            if not _llm_warned:
                model = os.getenv('GEMINI_MODEL') or 'gemini-2.5-flash-lite'
                log(f'LLM: Using Gemini ({model})')
                _llm_warned = True
            return _llm_gemini(title, text, url)
        except Exception as ex:
            log('Gemini API error:', type(ex).__name__, str(ex)[:100])
            # Fall back to OpenAI if available
            if openai_key:
                log('Falling back to OpenAI...')
            else:
                return None

    if openai_key:
        try:
            if not _llm_warned:
                model = os.getenv('OPENAI_MODEL') or 'gpt-4o-mini'
                log(f'LLM: Using OpenAI ({model})')
                _llm_warned = True
            return _llm_openai(title, text, url)
        except Exception as ex:
            log('OpenAI API error (continuing without LLM):', type(ex).__name__, str(ex)[:100])
            return None

    return None


# --- Trends Analysis for Investors ---

def _build_trends_prompt(articles_text: str, date: str) -> str:
    """投資家向けメタトレンド分析用プロンプト"""
    return f"""あなたは半導体業界の投資アナリストです。
以下のニュース記事群から業界のメタトレンドを抽出し、投資家向けの分析を行ってください。

## 分析対象
{date}の直近ニュース

## 入力記事
{articles_text}

## 出力（JSON形式のみ）
{{
  "meta_trends": [
    {{
      "name": "トレンド名（日本語、20文字以内）",
      "confidence": 0.85,
      "momentum": "rising",
      "related_fields": ["power", "automotive"],
      "summary": "トレンドの説明（100文字以内）",
      "analysis": {{
        "short_term": "短期見通し（1-3ヶ月、50文字以内）",
        "mid_term": "中期見通し（半年-1年、50文字以内）",
        "investment_implications": "投資示唆（50文字以内）"
      }},
      "keywords": ["SiC", "EV"],
      "companies_mentioned": ["企業名1", "企業名2"]
    }}
  ],
  "market_signals": {{
    "bullish": ["強気シグナル1", "強気シグナル2"],
    "bearish": ["弱気シグナル1"],
    "neutral": ["中立シグナル1"]
  }}
}}

## 注意事項
- meta_trendsは最大5件まで
- confidenceは0.0〜1.0の数値
- momentumは "rising" / "stable" / "declining" のいずれか
- related_fieldsは以下から選択: power, memory, logic, analog, image, ai, automotive, datacenter, industrial, foundry, fabless, idm, geopolitics, frontend, backend, miniaturization, equipment, wafer
- 出力はJSONのみ、他のテキストは含めないでください
"""


def _llm_gemini_trends(articles: list, date: str) -> dict | None:
    """Gemini APIでメタトレンド分析を実行"""
    key = os.getenv('GOOGLE_API_KEY')
    if not key:
        log('Trends: GOOGLE_API_KEY not set, skipping trends generation')
        return None

    # 記事テキストを構築
    articles_text = ""
    for i, art in enumerate(articles[:30], 1):  # 最大30件
        title = art.get('title', '')
        blurb = art.get('blurb', '')
        field = art.get('field', {})
        field_str = field.get('primary', '') if field else ''
        articles_text += f"{i}. [{field_str}] {title}\n   {blurb}\n\n"

    if not articles_text.strip():
        log('Trends: No articles to analyze')
        return None

    model = os.getenv('GEMINI_TRENDS_MODEL') or os.getenv('GEMINI_MODEL') or 'gemini-2.5-flash-lite'
    prompt = _build_trends_prompt(articles_text, date)

    payload = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.3,
            'responseMimeType': 'application/json'
        },
        'systemInstruction': {'parts': [{'text': '半導体業界の投資アナリストとして、正確で洞察力のある分析をJSON形式で提供してください。'}]}
    }

    try:
        log(f'Trends: Generating with {model}...')
        r = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}',
            json=payload,
            timeout=60
        )
        r.raise_for_status()
        ans = r.json()['candidates'][0]['content']['parts'][0]['text']

        # Parse JSON response
        ans = ans.strip()
        if ans.startswith('```'):
            ans = '\n'.join(ans.split('\n')[1:])
        if ans.endswith('```'):
            ans = ans.rsplit('```', 1)[0]
        ans = ans.strip()

        trends_data = json.loads(ans)
        log(f'Trends: Generated {len(trends_data.get("meta_trends", []))} trends')
        return trends_data
    except Exception as ex:
        log('Trends generation error:', type(ex).__name__, str(ex)[:100])
        return None


def generate_trends_json(enriched_items: list, date: str) -> None:
    """trends.json を生成"""
    # 半導体関連記事のみをフィルタ
    semi_items = [it for it in enriched_items if it.get('field')]

    if not semi_items:
        log('Trends: No semiconductor items, skipping')
        return

    # LLMでトレンド分析
    trends_data = _llm_gemini_trends(semi_items, date)

    if not trends_data:
        # フォールバック: 空のトレンドデータ
        trends_data = {
            'meta_trends': [],
            'market_signals': {'bullish': [], 'bearish': [], 'neutral': []}
        }

    # 出力データ構築
    output = {
        'generated_at': datetime.now(JST).isoformat(),
        'date': date,
        'meta_trends': trends_data.get('meta_trends', []),
        'market_signals': trends_data.get('market_signals', {'bullish': [], 'bearish': [], 'neutral': []}),
        'source_count': len(semi_items)
    }

    # 保存
    with open(os.path.join(NEWS_DIR, 'trends.json'), 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    log(f'trends.json: {len(output.get("meta_trends", []))} trends generated')

# --- main -------------------------------------------------

def main():
    os.makedirs(NEWS_DIR, exist_ok=True)
    feeds, x_users, x_rss_base, x_rss_users, sheets = load_sources()
    start_time = time.time()

    items = []
    only_sheets = os.getenv('NEWS_ONLY_SHEETS') == '1'
    if not only_sheets:
        for f in feeds:
            try:
                items.extend(fetch_feed(f))
            except Exception as ex:
                log('feed err', f, ex)
            if time.time() - start_time > GLOBAL_TIMEOUT_SEC:
                break

    # SNS
    if not only_sheets:
        if time.time() - start_time <= GLOBAL_TIMEOUT_SEC:
            items.extend(fetch_x_api(x_users))
        if time.time() - start_time <= GLOBAL_TIMEOUT_SEC:
            items.extend(fetch_x_rss(x_rss_base, x_rss_users))

    # Google Sheets
    for s in (sheets or []):
        try:
            sid = s.get('id')
            gid = s.get('gid', 0)
            mapping = s.get('mapping')
            rows = fetch_google_sheet_csv(sid, gid)
            items.extend(rows_to_items_from_sheet(rows, mapping))
        except Exception as ex:
            log('sheet fetch fail', ex)

    # Manual TSV fallback
    manual_rows = load_manual_sns(os.path.join(ROOT, 'news', 'manual_sns.tsv'))
    if manual_rows:
        items.extend(rows_to_items_from_sheet(manual_rows, {'date':0,'handle':1,'text':2,'url':4}))

    # dedup by URL & title
    uniq = []
    seen = set()
    for it in items:
        url = canon_url(it['url'])
        key = (url, it['title'].strip().lower())
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)
        if FAST_MODE and len(uniq) >= 200:
            break

    # title-similarity prune
    pruned = []
    if FAST_MODE:
        # 類似判定はスキップして速度優先
        pruned = uniq[:]
    else:
        for it in uniq:
            if any(very_similar(it['title'], p['title']) for p in pruned):
                continue
            pruned.append(it)
            if time.time() - start_time > GLOBAL_TIMEOUT_SEC:
                break

    # verify links quickly
    verified = pruned if FAST_MODE else [it for it in pruned if head_ok(it['url'])]

    # enrich with text, llm/fallback summary, score, category
    enriched = []
    for it in verified:
        body = extract_text(it['url'])
        llm = llm_summarize(it['title'], body or it['summary'], it['url'])
        cats = classify(it)
        base, stars = score(it)
        category = (llm and llm.get('category')) or cats[0]
        # 半導体分野判定
        semi_field = classify_field(it)

        item_out = {
            'title': it['title'],
            'blurb': (llm and llm.get('blurb')) or (body[:120] + '…' if body else it['summary'][:120]),
            'category': category,
            'date': it['published'][:10],
            'stars': int((llm and llm.get('stars')) or stars),
            'source': {'name': it['source_name'], 'url': it['url']},
            'field': semi_field  # 半導体分野dict: {'primary':..., 'device':..., 'process':..., 'market':..., 'industry':...} または None
        }
        # SNS向けの明示的な著者情報
        if category == 'sns' or (it.get('source_name') == 'x.com'):
            handle = it.get('author_handle') or re.sub(r'^https?://x\.com/([^/]+)/.*', r'\1', it['url'])
            if handle and not handle.startswith('@'):
                handle = '@' + handle
            item_out['sns'] = {
                'handle': handle,
                'display_name': it.get('author_display') or '',
                'posted_at': it.get('published')
            }
            # 出典の表示名はハンドルに
            item_out['source'] = {'name': handle or 'X', 'url': it['url']}
            item_out['category'] = 'sns'
        enriched.append(item_out)
        if FAST_MODE and len(enriched) >= 200:
            break
        if time.time() - start_time > GLOBAL_TIMEOUT_SEC:
            break

    # score again using produced blurb/title
    for it in enriched:
        base, stars = score({'title': it['title'], 'summary': it['blurb'], 'published': it['date'], 'source_name': it['source']['name']})
        it['stars'] = max(it['stars'], stars)

    # age-based filter for freshness (default 24h, widen to 48h if empty)
    def hours_since(datestr: str) -> float:
        try:
            dt = dateparser.parse(datestr).astimezone(JST)
        except Exception:
            dt = datetime.now(JST)
        return max(0.0, (datetime.now(JST) - dt).total_seconds()/3600)

    try:
        max_age_h = float(os.getenv('NEWS_MAX_AGE_HOURS', '24'))
    except Exception:
        max_age_h = 24.0

    fresh = [it for it in enriched if hours_since(it['date']) <= max_age_h]
    if not fresh and enriched:
        # widen once to 48h if nothing fresh
        fresh = [it for it in enriched if hours_since(it['date']) <= 48.0]

    # split into sections and pick上位
    sections = {'business': [], 'tools': [], 'company': [], 'sns': []}
    for it in (fresh or enriched):
        sections.setdefault(it['category'], sections['company']).append(it)

    # 並べ替え（stars→新しさ）
    def sortkey(x):
        try:
            dt = dateparser.parse(x['date'])
        except Exception:
            dt = datetime.now(JST)
        return (-x['stars'], dt)

    try:
        max_per = int(os.getenv('NEWS_MAX_PER_SECTION', '30'))
    except Exception:
        max_per = 30
    for k in sections:
        sections[k] = sorted(sections[k], key=sortkey)[:max_per]

    # highlight = SNSを除く全体から最高スコア（鮮度フィルタ後）
    non_sns_items = [x for x in (fresh or enriched) if x.get('category') != 'sns']
    all_items = sorted(non_sns_items, key=lambda x: (-x['stars']))
    hl = all_items[0] if all_items else None
    highlight = None
    if hl:
        highlight = {
            'category': '重要トピック',
            'stars': hl['stars'],
            'title': hl['title'],
            'summary': hl['blurb'],
            'sources': [hl['source']]
        }

    out = {
        'generated_at': datetime.now(JST).isoformat(),
        'highlight': highlight,
        'sections': sections
    }

    today = datetime.now(JST).strftime('%Y-%m-%d')
    with open(os.path.join(NEWS_DIR, 'latest.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    with open(os.path.join(NEWS_DIR, f'{today}.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # --- 半導体分野別JSON出力 ---
    # 半導体関連記事のみをフィルタリング（field dictが存在する記事）
    semi_items = [it for it in (fresh or enriched) if it.get('field')]

    # 全分野のリスト（primary分類に使用される可能性のあるすべての分野）
    ALL_FIELDS = [
        # デバイス種類
        'power', 'memory', 'logic', 'analog', 'image',
        # 市場用途
        'ai', 'automotive', 'datacenter', 'industrial',
        # 業界構造
        'foundry', 'fabless', 'idm', 'geopolitics',
        # 製造工程
        'frontend', 'backend', 'miniaturization', 'equipment', 'wafer',
        # 汎用
        'general'
    ]

    # primary分野でグループ化
    field_items = {f: [] for f in ALL_FIELDS}
    for it in semi_items:
        field_dict = it.get('field')
        if field_dict and isinstance(field_dict, dict):
            primary = field_dict.get('primary')
            if primary and primary in field_items:
                field_items[primary].append(it)

    # 分野別のセクション分割とJSON出力
    for field_name, items in field_items.items():
        if not items:
            continue

        # セクション分割（news/tech/market の3セクション）
        field_sections = {'news': [], 'tech': [], 'market': []}
        for it in items:
            cat = it.get('category', 'company')
            # カテゴリを半導体向けセクションにマッピング
            if cat in ('tools',):
                field_sections['tech'].append(it)
            elif cat in ('business',):
                field_sections['market'].append(it)
            else:
                # company, sns, その他 → news
                field_sections['news'].append(it)

        # 各セクションをソート
        for k in field_sections:
            field_sections[k] = sorted(field_sections[k], key=sortkey)[:max_per]

        # ハイライト選出（該当分野から最高スコア）
        field_non_sns = [x for x in items if x.get('category') != 'sns']
        field_all = sorted(field_non_sns, key=lambda x: (-x['stars']))
        field_hl = field_all[0] if field_all else None
        field_highlight = None
        if field_hl:
            field_highlight = {
                'category': '重要トピック',
                'stars': field_hl['stars'],
                'title': field_hl['title'],
                'summary': field_hl['blurb'],
                'sources': [field_hl['source']]
            }

        field_out = {
            'generated_at': datetime.now(JST).isoformat(),
            'field': field_name,
            'field_label': FIELD_LABELS.get(field_name, field_name),
            'highlight': field_highlight,
            'sections': field_sections
        }

        with open(os.path.join(NEWS_DIR, f'{field_name}.json'), 'w', encoding='utf-8') as f:
            json.dump(field_out, f, ensure_ascii=False, indent=2)
        log(f'{field_name}.json:', len(items), 'items')

    # --- 統計情報の生成 ---
    stats = {
        'generated_at': datetime.now(JST).isoformat(),
        'date': today,
        'total_items': len(enriched),
        'semiconductor_items': len(semi_items),
        'by_field': {field: len(items) for field, items in field_items.items() if items},
        'sources': sorted(list(set(it['source']['name'] for it in enriched))),
        'sections': {k: len(v) for k, v in sections.items()}
    }
    with open(os.path.join(NEWS_DIR, 'stats.json'), 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    log('stats.json: generated')

    # --- 投資家向けトレンド分析 ---
    generate_trends_json(enriched, today)

    log('DONE', len(enriched), 'items total,', len(semi_items), 'semiconductor-related')

if __name__ == '__main__':
    try:
        main()
    except Exception as ex:
        # Never fail the workflow - log error and exit cleanly
        log('FATAL ERROR (workflow will continue):', type(ex).__name__, str(ex))
        import traceback
        traceback.print_exc()
        # Create minimal output so downstream steps don't fail
        os.makedirs(NEWS_DIR, exist_ok=True)
        fallback = {
            'generated_at': datetime.now(JST).isoformat(),
            'highlight': None,
            'sections': {'business': [], 'tools': [], 'company': [], 'sns': []},
            'error': str(ex)
        }
        with open(os.path.join(NEWS_DIR, 'latest.json'), 'w', encoding='utf-8') as f:
            json.dump(fallback, f, ensure_ascii=False, indent=2)
        log('Created fallback latest.json due to error')
        # Exit with 0 to not fail the workflow
        exit(0)