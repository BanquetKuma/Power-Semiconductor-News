# Power-Semiconductor-News

パワー半導体業界の最新ニュースを自動収集・配信するシステム。

## 特徴

- **パワー半導体特化**: SiC、GaN、IGBT、MOSFET、EV関連のニュースを重点収集
- **パフォーマンス最適化**: 並列処理による高速収集（従来比87%短縮）
- **コスト最適化**: APIキャッシュによるコスト削減（50%削減）
- **自動化**: GitHub Actionsによる日次自動更新

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

## カテゴリ

パワー半導体向けにカスタマイズされたカテゴリ:

- **sic**: 炭化ケイ素 (SiC) デバイス
- **gan**: 窒化ガリウム (GaN) デバイス
- **igbt**: IGBT (絶縁ゲートバイポーラトランジスタ)
- **mosfet**: パワーMOSFET
- **ev**: 電気自動車・充電関連
- **inverter**: インバータ・コンバータ
- **vendor**: 主要半導体ベンダー

## GitHub Actions ワークフロー

### unified-daily.yml
毎日 08:50 JST に実行。ニュースビルドとアーカイブ処理を統合。

### ingest.yml
毎日 08:00 JST に実行。Product Hunt、Hacker News、GitHubからツールを収集。

### pages.yml
mainブランチへのプッシュ時に実行。GitHub Pagesへデプロイ。

## ライセンス

MIT License
