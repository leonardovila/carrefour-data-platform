from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import pyarrow as pa
import pyarrow.parquet as pq

from carrefour_etl.bronze.schema import PRODUCTS_SCHEMA, CATEGORIES_SCHEMA
from carrefour_etl.observability.run_context import RunContext


def _first(items: Optional[list]) -> Optional[dict]:
    return items[0] if items else None


def _flatten_product(
    product: dict[str, Any],
    source_category: dict[str, Any],
    ingest_run_id: str,
    ingest_ts: datetime,
) -> dict[str, Any]:
    items = product.get("items") or []
    first_item = _first(items) or {}
    sellers = first_item.get("sellers") or []
    first_seller = _first(sellers) or {}
    offer = first_seller.get("commertialOffer") or {}

    installments = offer.get("Installments") or []
    no_interest = [i for i in installments if (i.get("InterestRate") or 0) == 0]
    if no_interest:
        chosen = max(no_interest, key=lambda i: i.get("NumberOfInstallments", 0))
    elif installments:
        chosen = max(installments, key=lambda i: i.get("NumberOfInstallments", 0))
    else:
        chosen = {}

    teasers = offer.get("Teasers") or []
    teaser_names = [
        (t.get("name") or t.get("Name") or "").strip()
        for t in teasers if isinstance(t, dict)
    ]
    teaser_names = [t for t in teaser_names if t]

    ref_ids = first_item.get("referenceId") or []
    ref_id = ref_ids[0].get("Value") if ref_ids and isinstance(ref_ids[0], dict) else None

    images = first_item.get("images") or []
    image_url = images[0].get("imageUrl") if images and isinstance(images[0], dict) else None

    available_qty = offer.get("AvailableQuantity")
    is_available = (
        offer.get("IsAvailable")
        if "IsAvailable" in offer
        else ((available_qty or 0) > 0)
    )

    return {
        "ingest_run_id": ingest_run_id,
        "ingest_ts": ingest_ts,
        "source_category_id": str(source_category.get("id") or ""),
        "source_category_name": source_category.get("name"),

        "product_id": str(product.get("productId") or ""),
        "product_name": product.get("productName"),
        "brand": product.get("brand"),
        "brand_id": str(product["brandId"]) if product.get("brandId") is not None else None,
        "link": product.get("link"),
        "link_text": product.get("linkText"),
        "description": product.get("description"),

        "categories": [str(c) for c in (product.get("categories") or [])],
        "category_ids": [str(c) for c in (product.get("categoriesIds") or [])],

        "ean": first_item.get("ean"),
        "ref_id": ref_id,

        "seller_id": first_seller.get("sellerId"),
        "seller_name": first_seller.get("sellerName"),

        "list_price": offer.get("ListPrice"),
        "selling_price": offer.get("Price"),
        "price_without_discount": offer.get("PriceWithoutDiscount"),
        "price_currency": offer.get("CurrencyCode") or "ARS",

        "available_quantity": int(available_qty) if available_qty is not None else None,
        "is_available": is_available,

        "installments_max_count": chosen.get("NumberOfInstallments"),
        "installments_value": chosen.get("Value"),
        "installments_total_value": chosen.get("TotalValuePlusInterestRate"),
        "installments_payment_system": chosen.get("PaymentSystemName"),
        "teasers": teaser_names,

        "image_url": image_url,

        "raw_payload_json": json.dumps(product, ensure_ascii=False, separators=(",", ":")),
    }


def cleanup_partition(bronze_dir: Path, ingest_date: str) -> int:
    """
    Borra los .parquet de products de la particion del dia.
    Necesario al inicio del run para que la escritura incremental sea idempotente
    (si re-corremos el mismo dia, no acumulamos archivos viejos del run anterior).
    """
    partition_dir = bronze_dir / f"ingest_date={ingest_date}"
    if not partition_dir.exists():
        return 0
    deleted = 0
    for p in partition_dir.glob("products_cat*.parquet"):
        p.unlink()
        deleted += 1
    return deleted


def write_one_category_bronze(
    ctx: RunContext,
    products: list[dict[str, Any]],
    source_category: dict[str, Any],
    bronze_dir: Path,
    ingest_ts: datetime,
) -> Optional[Path]:
    """
    Escribe el parquet de UNA categoria. Cada cat -> un archivo distinto.
    Hive partitioning sigue funcionando (todos los .parquet del dir se leen).
    Memory footprint chico: solo los productos de esa cat en memoria.
    """
    if not products:
        return None

    ingest_date = ingest_ts.strftime("%Y-%m-%d")
    cat_id = str(source_category.get("id") or "unknown")

    rows = [
        _flatten_product(p, source_category, ctx.run_id, ingest_ts)
        for p in products
    ]
    table = pa.Table.from_pylist(rows, schema=PRODUCTS_SCHEMA)

    partition_dir = bronze_dir / f"ingest_date={ingest_date}"
    partition_dir.mkdir(parents=True, exist_ok=True)
    out_path = partition_dir / f"products_cat{cat_id.zfill(6)}.parquet"

    pq.write_table(table, out_path, compression="zstd", compression_level=3)

    ctx.event(
        "category_parquet_written",
        category_id=cat_id,
        path=str(out_path),
        rows=table.num_rows,
        bytes=out_path.stat().st_size,
    )
    return out_path


# Conservada por compatibilidad con tests / escenarios donde se acumula todo
def write_products_bronze(
    ctx: RunContext,
    enriched_products: list[tuple[dict[str, Any], dict[str, Any]]],
    bronze_dir: Path,
) -> Optional[Path]:
    if not enriched_products:
        ctx.event("write_products_bronze_skip", reason="empty_dataset")
        return None

    ingest_ts = datetime.now(timezone.utc)
    ingest_date = ingest_ts.strftime("%Y-%m-%d")
    ingest_run_id = ctx.run_id

    rows = [
        _flatten_product(prod, src_cat, ingest_run_id, ingest_ts)
        for src_cat, prod in enriched_products
    ]

    table = pa.Table.from_pylist(rows, schema=PRODUCTS_SCHEMA)

    partition_dir = bronze_dir / f"ingest_date={ingest_date}"
    partition_dir.mkdir(parents=True, exist_ok=True)
    out_path = partition_dir / "products.parquet"

    pq.write_table(table, out_path, compression="zstd", compression_level=3)

    ctx.event(
        "products_bronze_written",
        path=str(out_path),
        rows=table.num_rows,
        bytes=out_path.stat().st_size,
        partition_date=ingest_date,
    )
    return out_path


def write_categories_bronze(
    ctx: RunContext,
    categories: list[dict[str, Any]],
    bronze_dir: Path,
) -> Optional[Path]:
    if not categories:
        ctx.event("write_categories_bronze_skip", reason="empty_dataset")
        return None

    ingest_ts = datetime.now(timezone.utc)
    ingest_date = ingest_ts.strftime("%Y-%m-%d")

    rows = [
        {
            "ingest_run_id": ctx.run_id,
            "ingest_ts": ingest_ts,
            "category_id": str(cat["id"]),
            "category_name": cat.get("name"),
            "category_url": cat.get("url"),
            "category_path": cat.get("path"),
        }
        for cat in categories
    ]

    table = pa.Table.from_pylist(rows, schema=CATEGORIES_SCHEMA)

    partition_dir = bronze_dir / f"ingest_date={ingest_date}"
    partition_dir.mkdir(parents=True, exist_ok=True)
    out_path = partition_dir / "categories.parquet"

    pq.write_table(table, out_path, compression="zstd", compression_level=3)

    ctx.event(
        "categories_bronze_written",
        path=str(out_path),
        rows=table.num_rows,
        bytes=out_path.stat().st_size,
        partition_date=ingest_date,
    )
    return out_path
