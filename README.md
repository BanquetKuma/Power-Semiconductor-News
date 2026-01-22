# Power-Semiconductor-News

[![Daily News](https://github.com/BanquetKuma/Power-Semiconductor-News/actions/workflows/unified-daily.yml/badge.svg)](https://github.com/BanquetKuma/Power-Semiconductor-News/actions/workflows/unified-daily.yml)

**サイトURL**: https://banquetkuma.github.io/Power-Semiconductor-News/

半導体業界の最新ニュースを自動収集・分野別分類・配信するシステム。

## 特徴

- **4軸20分野の自動分類**: デバイス種類/製造工程/市場用途/業界構造で分類
- **分野別JSON出力**: power.json, memory.json, automotive.json 等を自動生成
- **パフォーマンス最適化**: 並列処理による高速収集（従来比87%短縮）
- **コスト最適化**: APIキャッシュによるコスト削減（50%削減）
- **自動化**: GitHub Actionsによる日次自動更新（毎日08:50 JST）

## 最適化内容

| 最適化項目 | 効果 |
|-----------|------|
| API収集の並列化 | 60秒 → 20秒 (67%削減) |
| HNストーリー並列取得 | 15秒 → 3秒 (80%削減) |
| RSS並列取得 | 75秒 → 15秒 (80%削減) |
| GitHub Actions統合 | 150分 → 20分 (87%削減) |
| OpenAI APIキャッシュ | コスト50%削減 |

## セットアップ

### 必要な環境変数

```bash
# GitHub Actions Secrets
OPENAI_API_KEY=sk-...        # OpenAI API key (optional)
PH_TOKEN=...                  # Product Hunt API token (optional)
GITHUB_TOKEN=...              # GitHub PAT (optional, for higher rate limits)
X_BEARER_TOKEN=...            # X (Twitter) API token (optional)
```

### ローカル開発

```bash
# Python依存関係のインストール
pip install -r requirements.txt
pip install -r requirements-ingest.txt

# ニュース収集の実行
python scripts/ingest.py --dry-run

# ニュースJSONのビルド
python script/build_news.py
```

## プロジェクト構成

```
Power-Semiconductor-News/
├── scripts/
│   ├── collectors/           # データ収集モジュール
│   │   ├── base.py          # ベースクラス
│   │   ├── hn.py            # Hacker News (並列化済)
│   │   ├── github.py        # GitHub (遅延最適化)
│   │   └── producthunt.py   # Product Hunt (遅延最適化)
│   ├── utils/
│   │   └── cache.py         # キャッシュユーティリティ
│   ├── config.py            # 設定（パワー半導体カテゴリ）
│   └── ingest.py            # メイン収集スクリプト (並列実行)
├── script/
│   └── build_news.py        # ニュースビルダー (RSS並列+キャッシュ)
├── .github/workflows/
│   ├── unified-daily.yml    # 統合日次パイプライン
│   ├── ingest.yml           # ツール収集
│   └── pages.yml            # GitHub Pages デプロイ
├── data/                    # 収集データ
├── news/                    # ニュースJSON
├── cache/                   # APIキャッシュ
├── sources.yaml             # ニュースソース設定
└── requirements.txt         # Python依存関係
```

## 分野分類（4軸20分野）

### デバイスの種類
| 分野 | ファイル | キーワード例 |
|------|---------|-------------|
| パワー半導体 | `power.json` | SiC, GaN, IGBT, MOSFET |
| メモリ半導体 | `memory.json` | DRAM, NAND, HBM |
| ロジック半導体 | `logic.json` | CPU, GPU, FPGA, ASIC |
| アナログ半導体 | `analog.json` | センサ, PMIC, ADC |
| イメージセンサ | `image.json` | CMOSセンサ, CCD |

### 市場・アプリケーション
| 分野 | ファイル | キーワード例 |
|------|---------|-------------|
| AI半導体 | `ai.json` | AIチップ, アクセラレータ |
| 車載半導体 | `automotive.json` | 自動運転, ADAS, EV |
| データセンター | `datacenter.json` | サーバ, クラウド |
| 産業機器 | `industrial.json` | IoT, FA |

### 業界構造
| 分野 | ファイル | キーワード例 |
|------|---------|-------------|
| ファウンドリ | `foundry.json` | TSMC, Samsung, Rapidus |
| ファブレス | `fabless.json` | NVIDIA, Qualcomm, AMD |
| 地政学・規制 | `geopolitics.json` | CHIPS法, 輸出規制 |

## GitHub Actions ワークフロー

### unified-daily.yml
毎日 08:50 JST に実行。ニュースビルドとアーカイブ処理を統合。

### ingest.yml
毎日 08:00 JST に実行。Product Hunt、Hacker News、GitHubからツールを収集。

### pages.yml
mainブランチへのプッシュ時に実行。GitHub Pagesへデプロイ。

## ライセンス

MIT License
