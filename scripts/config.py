"""
Configuration for Power-Semiconductor-News system.

Customized for power semiconductor industry news collection.
"""

import logging
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DAILY_DIR = DATA_DIR / "daily"
CACHE_DIR = PROJECT_ROOT / "cache"
TOOLS_FILE = DATA_DIR / "tools.json"
INDEX_FILE = DATA_DIR / "index.json"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
DAILY_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)

# Logging configuration
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_LEVEL = logging.INFO

# Scoring weights
SCORING_WEIGHTS = {
    "source_rank": 20,       # Top ranking bonus
    "source_votes": 25,      # Votes/stars contribution
    "has_official_url": 10,  # Has real official website
    "has_description": 10,   # Has good description
    "topic_diversity": 5,    # Multiple topics
    "category_match": 15,    # Matches priority categories
}

# Priority categories for power semiconductor news
PRIORITY_CATEGORIES = ["sic", "gan", "igbt", "mosfet", "ev", "inverter", "vendor"]

# Category keywords - customized for power semiconductor industry
CATEGORY_KEYWORDS = {
    "sic": [
        "sic", "silicon carbide", "炭化ケイ素", "シリコンカーバイド",
        "wolfspeed", "cree", "rohm sic", "infineon sic"
    ],
    "gan": [
        "gan", "gallium nitride", "窒化ガリウム", "ガリウムナイトライド",
        "navitas", "efficient power", "transphorm"
    ],
    "igbt": [
        "igbt", "絶縁ゲートバイポーラトランジスタ", "insulated gate",
        "infineon igbt", "fuji igbt", "mitsubishi igbt"
    ],
    "mosfet": [
        "mosfet", "power mosfet", "パワーmosfet",
        "superjunction", "trench mosfet"
    ],
    "ev": [
        "ev", "電気自動車", "bev", "hev", "phev", "electric vehicle",
        "ev充電", "急速充電", "チャデモ", "chademo", "ccs"
    ],
    "inverter": [
        "インバータ", "inverter", "変換器", "コンバータ", "converter",
        "パワーコンディショナー", "pcs", "power conditioner"
    ],
    "charger": [
        "充電器", "charger", "obc", "onboard charger",
        "急速充電器", "普通充電"
    ],
    "vendor": [
        "infineon", "wolfspeed", "onsemi", "on semiconductor",
        "rohm", "st microelectronics", "stm", "三菱電機", "富士電機",
        "fuji electric", "mitsubishi electric", "renesas", "ルネサス",
        "texas instruments", "ti", "nxp", "toshiba", "東芝"
    ],
    "application": [
        "太陽光", "solar", "pv", "wind", "風力", "蓄電池",
        "battery", "データセンター", "data center", "サーバー電源"
    ],
}

# Deduplication threshold
DEDUPE_NAME_THRESHOLD = 0.85

# Cache settings
CACHE_TTL_HOURS = 24
OPENAI_CACHE_TTL_HOURS = 168  # 1 week for LLM responses
