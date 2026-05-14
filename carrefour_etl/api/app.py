"""
Carrefour Bronze API — read-only sobre el data lake parquet local.

Stack:
- FastAPI + uvicorn :8002  (8001 esta ocupado por la API de Costco)
- DuckDB como motor de queries (lee parquets directo, sin DB intermedia)
- Hive partitioning: cada query inyecta `ingest_date` como columna virtual

Filosofia:
- Solo GETs. La ingesta escribe el bronze; la API lo lee.
- Sin cache: DuckDB es lo bastante rapido sobre parquets locales.
- Sin estado: el cron rebuilds bronze, la API es stateless.
"""
from __future__ import annotations
import glob as glob_mod
import duckdb
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from carrefour_etl.storage.paths import PRODUCTS_BRONZE_DIR, CATEGORIES_BRONZE_DIR
from carrefour_etl.api.cloud_routes import router as cloud_router

# DuckDB acepta backslashes pero forward slashes son universales
PRODUCTS_GLOB = (PRODUCTS_BRONZE_DIR / "**" / "*.parquet").as_posix()
CATEGORIES_GLOB = (CATEGORIES_BRONZE_DIR / "**" / "*.parquet").as_posix()

def get_con() -> duckdb.DuckDBPyConnection:
    """
    Una conexion in-memory por request.
    DuckDB connect es del orden de ms y es la forma segura cuando uvicorn
    despacha handlers en threads distintos del threadpool.
    """
    return duckdb.connect()


def _has_data(glob_pattern: str) -> bool:
    return bool(glob_mod.glob(glob_pattern, recursive=True))


def _list_partitions(bronze_dir) -> list[str]:
    """
    Lista las fechas de particion presentes en disco.
    Resolvemos esto con filesystem en vez de DuckDB porque DuckDB tiene
    un bug interno cuando hace max() sobre la columna inyectada por
    hive_partitioning (el `INTERNAL Error: index 30 within vector of size 30`).
    """
    if not bronze_dir.exists():
        return []
    parts: list[str] = []
    for child in bronze_dir.iterdir():
        if not child.is_dir() or "=" not in child.name:
            continue
        key, _, value = child.name.partition("=")
        if key == "ingest_date" and value and any(child.glob("*.parquet")):
            parts.append(value)
    return sorted(parts, reverse=True)


def _resolve_latest_date(_con: duckdb.DuckDBPyConnection, bronze_dir) -> str | None:
    parts = _list_partitions(bronze_dir)
    return parts[0] if parts else None


app = FastAPI(
    title="Carrefour Bronze API",
    version="0.1.0",
    description="Read-only API sobre el bronze layer (parquets particionados por ingest_date).",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Endpoints /cloud/* que consultan Athena (Star schema sobre el bronze en S3).
app.include_router(cloud_router)

# Dashboard HTML estatico en /web (sirve frontend/index.html via la misma API).
_FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
if _FRONTEND_DIR.exists():
    app.mount("/web", StaticFiles(directory=str(_FRONTEND_DIR), html=True), name="web")


@app.get("/")
def root() -> dict:
    return {"status": "api ok", "mode": "read-only", "layer": "bronze", "port_convention": 8002}


@app.get("/system/status")
def status() -> dict:
    con = get_con()
    if not _has_data(PRODUCTS_GLOB):
        return {"partitions": [], "latest_date": None, "total_partitions": 0, "warning": "no_bronze_data_yet"}

    rows = con.execute(
        f"""
        SELECT ingest_date::VARCHAR AS date,
               count(*) AS products,
               count(DISTINCT product_id) AS unique_products,
               count(DISTINCT brand) AS brands,
               count(DISTINCT source_category_id) AS source_categories
        FROM read_parquet('{PRODUCTS_GLOB}', hive_partitioning=true)
        GROUP BY 1 ORDER BY 1 DESC
        """
    ).fetchall()
    cols = ["ingest_date", "products", "unique_products", "brands", "source_categories"]
    partitions = [dict(zip(cols, r)) for r in rows]
    return {
        "partitions": partitions,
        "latest_date": partitions[0]["ingest_date"] if partitions else None,
        "total_partitions": len(partitions),
    }


@app.get("/partitions")
def partitions() -> dict:
    return {"dates": _list_partitions(PRODUCTS_BRONZE_DIR)}


@app.get("/products")
def list_products(
    date: str | None = Query(None, description="ingest_date YYYY-MM-DD; default = mas reciente"),
    brand: str | None = None,
    seller: str | None = None,
    category_id: str | None = None,
    available_only: bool = True,
    order: str = Query("price_asc", pattern="^(price_asc|price_desc|discount_desc)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> dict:
    con = get_con()

    if date is None:
        date = _resolve_latest_date(con, PRODUCTS_BRONZE_DIR)
    if date is None:
        return {"date": None, "rows": [], "total": 0, "warning": "no_bronze_data_yet"}

    where = ["ingest_date = ?::DATE"]
    params: list = [date]
    if brand:
        where.append("brand = ?")
        params.append(brand)
    if seller:
        where.append("seller_name = ?")
        params.append(seller)
    if category_id:
        where.append("source_category_id = ?")
        params.append(category_id)
    if available_only:
        where.append("is_available = TRUE")

    where_sql = " AND ".join(where)

    order_sql = {
        "price_asc": "selling_price ASC NULLS LAST",
        "price_desc": "selling_price DESC NULLS LAST",
        "discount_desc": "(list_price - selling_price) DESC NULLS LAST",
    }[order]

    cols = (
        "product_id, product_name, brand, selling_price, list_price, "
        "price_without_discount, seller_name, available_quantity, image_url, link, "
        "installments_max_count, installments_value, ean, source_category_id, "
        "source_category_name, teasers"
    )

    total_row = con.execute(
        f"SELECT count(*) FROM read_parquet('{PRODUCTS_GLOB}', hive_partitioning=true) WHERE {where_sql}",
        params,
    ).fetchone()
    total = int(total_row[0]) if total_row else 0

    rows = con.execute(
        f"""
        SELECT {cols}
        FROM read_parquet('{PRODUCTS_GLOB}', hive_partitioning=true)
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT ? OFFSET ?
        """,
        params + [limit, offset],
    ).fetchall()

    col_names = [c.strip() for c in cols.split(",")]
    data = [dict(zip(col_names, r)) for r in rows]
    return {
        "date": date,
        "total": total,
        "limit": limit,
        "offset": offset,
        "filters": {"brand": brand, "seller": seller, "category_id": category_id, "available_only": available_only},
        "order": order,
        "rows": data,
    }


@app.get("/products/{product_id}")
def product_detail(product_id: str, date: str | None = None) -> dict:
    con = get_con()
    if date is None:
        date = _resolve_latest_date(con, PRODUCTS_BRONZE_DIR)
    if date is None:
        raise HTTPException(404, "no bronze data")

    cols = (
        "product_id, product_name, brand, brand_id, selling_price, list_price, "
        "price_without_discount, price_currency, seller_name, seller_id, "
        "available_quantity, is_available, image_url, link, link_text, description, "
        "installments_max_count, installments_value, installments_total_value, "
        "installments_payment_system, teasers, ean, ref_id, source_category_id, "
        "source_category_name, categories, category_ids, ingest_run_id, ingest_ts"
    )
    row = con.execute(
        f"""
        SELECT {cols}
        FROM read_parquet('{PRODUCTS_GLOB}', hive_partitioning=true)
        WHERE ingest_date = ?::DATE AND product_id = ?
        LIMIT 1
        """,
        [date, product_id],
    ).fetchone()

    if row is None:
        raise HTTPException(404, f"product {product_id} not found in partition {date}")

    return {"date": date, "product": dict(zip([c.strip() for c in cols.split(",")], row))}


@app.get("/catalog/brands")
def brands(date: str | None = None, top: int = Query(50, ge=1, le=500)) -> dict:
    con = get_con()
    if date is None:
        date = _resolve_latest_date(con, PRODUCTS_BRONZE_DIR)
    if date is None:
        return {"date": None, "brands": []}

    rows = con.execute(
        f"""
        SELECT brand, count(*) AS products,
               round(avg(selling_price), 2) AS avg_price,
               min(selling_price) AS min_price,
               max(selling_price) AS max_price
        FROM read_parquet('{PRODUCTS_GLOB}', hive_partitioning=true)
        WHERE ingest_date = ?::DATE AND brand IS NOT NULL AND is_available = TRUE
        GROUP BY 1 ORDER BY products DESC LIMIT ?
        """,
        [date, top],
    ).fetchall()
    cols = ["brand", "products", "avg_price", "min_price", "max_price"]
    return {"date": date, "brands": [dict(zip(cols, r)) for r in rows]}


@app.get("/catalog/categories")
def categories(date: str | None = None) -> dict:
    con = get_con()
    if date is None:
        date = _resolve_latest_date(con, CATEGORIES_BRONZE_DIR)
    if date is None:
        return {"date": None, "categories": []}

    rows = con.execute(
        f"""
        SELECT category_id, category_name, category_url, category_path
        FROM read_parquet('{CATEGORIES_GLOB}', hive_partitioning=true)
        WHERE ingest_date = ?::DATE
        ORDER BY category_name
        """,
        [date],
    ).fetchall()
    cols = ["id", "name", "url", "path"]
    return {"date": date, "categories": [dict(zip(cols, r)) for r in rows]}
