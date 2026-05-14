from __future__ import annotations
import argparse
import asyncio
from datetime import datetime, timezone

from carrefour_etl.observability.run_context import RunContext
from carrefour_etl.extraction.discover_categories import discover_leaf_categories
from carrefour_etl.extraction.extract_products import extract_all_products, CONCURRENT_CATEGORIES, PAGE_SIZE
from carrefour_etl.bronze.write_parquet import (
    write_one_category_bronze,
    write_categories_bronze,
    cleanup_partition,
)
from carrefour_etl.bronze.sync_s3 import sync_partition_to_s3, upload_file_to_s3
from carrefour_etl.bronze.register_partitions import register_partitions
from carrefour_etl.bronze.cleanup_local import cleanup_old_local_partitions
from carrefour_etl.storage.paths import (
    PRODUCTS_BRONZE_DIR,
    CATEGORIES_BRONZE_DIR,
    CHECKPOINT_DIR,
    S3_BUCKET,
    S3_PREFIX,
)

# Cuantas particiones locales conservar en el VPS. El resto se borra
# despues del sync; siguen disponibles en S3.
LOCAL_PARTITIONS_TO_KEEP = 7

# Smart TV (id 5): pocos productos, ideal para validar el pipeline end-to-end
DEMO_CATEGORY_ID = 5

# Si mas del 30% de las categorias fallan, abortamos antes de escribir bronze
SAFETY_ERROR_RATIO = 0.30


async def run_pipeline(ctx: RunContext, demo: bool, skip_s3: bool) -> None:
    # ---- FASE A: Discovery
    with ctx.span("discover_categories"):
        all_categories = discover_leaf_categories(ctx)

        if demo:
            categories = [c for c in all_categories if c["id"] == DEMO_CATEGORY_ID]
            if not categories:
                categories = [c for c in all_categories if c.get("url")][:1]
        else:
            categories = all_categories

    ctx.report["stages"]["discover_categories"]["categories_to_extract"] = len(categories)

    # ---- BRONZE setup: limpiar particion del dia (idempotencia)
    ingest_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ingest_ts = datetime.now(timezone.utc)
    with ctx.span("cleanup_partition", ingest_date=ingest_date):
        deleted = cleanup_partition(PRODUCTS_BRONZE_DIR, ingest_date)
        ctx.event("partition_cleaned", deleted_files=deleted, ingest_date=ingest_date)

    # ---- Streaming callback: por cada categoria, escribir parquet local + (opc) subir a S3
    use_s3 = (not skip_s3) and bool(S3_BUCKET)

    def on_category_done(category: dict, products: list[dict]) -> None:
        if not products:
            return
        path = write_one_category_bronze(
            ctx, products, category, PRODUCTS_BRONZE_DIR, ingest_ts,
        )
        if use_s3 and path is not None:
            s3_key = f"{S3_PREFIX}/products_raw/ingest_date={ingest_date}/{path.name}"
            upload_file_to_s3(ctx, path, S3_BUCKET, s3_key)

    # ---- FASE B: Extraction async + write streaming
    checkpoint_path = CHECKPOINT_DIR / f"extraction_checkpoint_{ctx.run_id}.json"
    with ctx.span(
        "extract_and_persist_streaming",
        concurrent_categories=CONCURRENT_CATEGORIES,
        page_size=PAGE_SIZE,
        target_categories=len(categories),
        s3_enabled=use_s3,
    ):
        ext_summary = await extract_all_products(
            ctx, categories, checkpoint_path,
            on_category_done=on_category_done,
        )

    ctx.report["stages"]["extract_and_persist_streaming"].update(ext_summary)

    if not demo and len(categories) > 0:
        error_ratio = ext_summary["categories_error"] / len(categories)
        if error_ratio > SAFETY_ERROR_RATIO:
            ctx.event(
                "safety_warning",
                level="WARNING",
                error_ratio=error_ratio,
                threshold=SAFETY_ERROR_RATIO,
                note="Bronze YA escrito en streaming (no podemos abortar). Quedan archivos parciales.",
            )

    # ---- Categorias bronze (chico, una sola pasada)
    with ctx.span("write_categories_bronze"):
        cat_path = write_categories_bronze(ctx, categories, CATEGORIES_BRONZE_DIR)
        if use_s3 and cat_path is not None:
            s3_key = f"{S3_PREFIX}/categories_raw/ingest_date={ingest_date}/{cat_path.name}"
            upload_file_to_s3(ctx, cat_path, S3_BUCKET, s3_key)

    if not use_s3:
        ctx.event("s3_sync_skipped_by_config", skip_s3=skip_s3, has_bucket=bool(S3_BUCKET))

    # ---- FASE C: Reconciliar particiones nuevas con el Glue Data Catalog.
    # Sin este step, Athena nunca "ve" las particiones nuevas y los marts
    # devuelven la data del primer crawl que se haya hecho a mano.
    if use_s3:
        with ctx.span("register_partitions_in_catalog"):
            reg = register_partitions(ctx)
            ctx.report["stages"]["register_partitions_in_catalog"].update(reg)

    # ---- FASE D: Cleanup local. El VPS solo conserva las ultimas N
    # particiones; las viejas viven en S3.
    with ctx.span("cleanup_old_local_partitions", keep_last_n=LOCAL_PARTITIONS_TO_KEEP):
        cleanup = cleanup_old_local_partitions(
            ctx,
            [PRODUCTS_BRONZE_DIR, CATEGORIES_BRONZE_DIR],
            keep_last_n=LOCAL_PARTITIONS_TO_KEEP,
        )
        ctx.report["stages"]["cleanup_old_local_partitions"].update(cleanup)


def main() -> None:
    parser = argparse.ArgumentParser(description="Carrefour ETL — Bronze ingestion")
    parser.add_argument(
        "--demo", action="store_true",
        help="Modo demo: solo 1 categoria chica (Smart TV). Implica --skip-s3.",
    )
    parser.add_argument(
        "--skip-s3", action="store_true",
        help="Genera parquets locales pero no sube a S3.",
    )
    args = parser.parse_args()

    skip_s3 = args.skip_s3 or args.demo

    ctx = RunContext(run_name="carrefour_bronze_ingest")
    try:
        asyncio.run(run_pipeline(ctx, demo=args.demo, skip_s3=skip_s3))
        ctx.finalize(status="success")
    except Exception:
        ctx.finalize(status="error")
        raise


if __name__ == "__main__":
    main()
