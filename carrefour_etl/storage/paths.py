from __future__ import annotations
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = Path(os.environ.get("CARREFOUR_DATA_DIR", PROJECT_ROOT / "data"))
LOGS_DIR = Path(os.environ.get("CARREFOUR_LOGS_DIR", PROJECT_ROOT / "logs"))

BRONZE_DIR = DATA_DIR / "bronze"
PRODUCTS_BRONZE_DIR = BRONZE_DIR / "products_raw"
CATEGORIES_BRONZE_DIR = BRONZE_DIR / "categories_raw"

CHECKPOINT_DIR = DATA_DIR / "checkpoints"

S3_BUCKET = os.environ.get("CARREFOUR_S3_BUCKET", "")
S3_PREFIX = os.environ.get("CARREFOUR_S3_PREFIX", "bronze")

for _d in (DATA_DIR, LOGS_DIR, BRONZE_DIR, PRODUCTS_BRONZE_DIR, CATEGORIES_BRONZE_DIR, CHECKPOINT_DIR):
    _d.mkdir(parents=True, exist_ok=True)
