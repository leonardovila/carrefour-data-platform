from __future__ import annotations
import pyarrow as pa

# Una fila por (run, producto, categoria_origen).
# raw_payload_json funciona como escape hatch para campos nuevos no promovidos a columna.
# IMPORTANTE: `ingest_date` NO esta en el schema. Vive solo en el path Hive
# (ingest_date=YYYY-MM-DD/...) y los lectores (DuckDB, Athena, Spark) lo inyectan
# al leer. Duplicarla acá rompe el merge de schemas en lectura.
PRODUCTS_SCHEMA = pa.schema([
    # Auditoria del run
    pa.field("ingest_run_id", pa.string(), nullable=False),
    pa.field("ingest_ts", pa.timestamp("ms", tz="UTC"), nullable=False),
    pa.field("source_category_id", pa.string(), nullable=False),
    pa.field("source_category_name", pa.string()),

    # Identidad
    pa.field("product_id", pa.string(), nullable=False),
    pa.field("product_name", pa.string()),
    pa.field("brand", pa.string()),
    pa.field("brand_id", pa.string()),
    pa.field("link", pa.string()),
    pa.field("link_text", pa.string()),
    pa.field("description", pa.string()),

    # Categorias declaradas por el producto (suele tener varias en VTEX)
    pa.field("categories", pa.list_(pa.string())),
    pa.field("category_ids", pa.list_(pa.string())),

    # Identificadores externos (clave para futuros cruces multi-super)
    pa.field("ean", pa.string()),
    pa.field("ref_id", pa.string()),

    # Seller principal (multi-seller queda en raw_payload_json para v1)
    pa.field("seller_id", pa.string()),
    pa.field("seller_name", pa.string()),

    # Precios (ARS)
    pa.field("list_price", pa.float64()),
    pa.field("selling_price", pa.float64()),
    pa.field("price_without_discount", pa.float64()),
    pa.field("price_currency", pa.string()),

    # Disponibilidad
    pa.field("available_quantity", pa.int64()),
    pa.field("is_available", pa.bool_()),

    # Comercial Argentina (cuotas + promos bancarias)
    pa.field("installments_max_count", pa.int64()),
    pa.field("installments_value", pa.float64()),
    pa.field("installments_total_value", pa.float64()),
    pa.field("installments_payment_system", pa.string()),
    pa.field("teasers", pa.list_(pa.string())),

    pa.field("image_url", pa.string()),
    pa.field("raw_payload_json", pa.string()),
])

CATEGORIES_SCHEMA = pa.schema([
    pa.field("ingest_run_id", pa.string(), nullable=False),
    pa.field("ingest_ts", pa.timestamp("ms", tz="UTC"), nullable=False),
    pa.field("category_id", pa.string(), nullable=False),
    pa.field("category_name", pa.string()),
    pa.field("category_url", pa.string()),
    pa.field("category_path", pa.string()),
])
