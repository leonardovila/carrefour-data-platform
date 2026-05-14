"""
Registra las particiones nuevas de S3 en el Glue Data Catalog
para que Athena las "vea" inmediatamente despues del ingest.

Sin este step, los .parquet quedan en S3 pero los SELECT contra
las views Athena devuelven solo la data de la primera particion
que el crawler haya descubierto manualmente.

Mecanismo: MSCK REPAIR TABLE (DDL idempotente, gratis en Athena,
escala bien hasta miles de particiones).

Permisos minimos requeridos en el IAM del ingester:
- athena:StartQueryExecution / GetQueryExecution
- glue:GetTable / GetPartitions
- glue:CreatePartition / BatchCreatePartition
- glue:UpdateTable
- s3:ListBucket sobre el bucket bronze
"""
from __future__ import annotations
import os
import time
from typing import Iterable

from carrefour_etl.observability.run_context import RunContext

WORKGROUP = os.environ.get("CARREFOUR_ATHENA_WORKGROUP", "carrefour-wg")
DATABASE = os.environ.get("CARREFOUR_GLUE_DATABASE", "carrefour_bronze")
REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-2")

# Tablas creadas por el Glue crawler que necesitan partition reconciliation.
DEFAULT_TABLES = ("products_raw", "categories_raw")


def _run_athena_ddl(client, sql: str, max_wait_s: int = 90) -> str:
    """Ejecuta DDL en Athena y espera a que termine. Devuelve el query_id."""
    resp = client.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={"Database": DATABASE},
        WorkGroup=WORKGROUP,
    )
    qid = resp["QueryExecutionId"]
    deadline = time.time() + max_wait_s
    while True:
        st = client.get_query_execution(QueryExecutionId=qid)["QueryExecution"]["Status"]
        state = st["State"]
        if state == "SUCCEEDED":
            return qid
        if state in ("FAILED", "CANCELLED"):
            raise RuntimeError(f"{state}: {st.get('StateChangeReason', '')[:300]}")
        if time.time() > deadline:
            raise TimeoutError(f"DDL timeout despues de {max_wait_s}s (qid={qid})")
        time.sleep(0.5)


def register_partitions(
    ctx: RunContext,
    tables: Iterable[str] = DEFAULT_TABLES,
) -> dict:
    """
    Corre MSCK REPAIR TABLE para cada tabla. No falla si una tabla todavia
    no existe (caso primer deploy antes del crawler inicial): se loguea
    y se sigue.
    """
    try:
        import boto3
    except ImportError:
        ctx.event("partition_register_skipped", level="WARNING", reason="boto3_missing")
        return {"skipped": True, "reason": "boto3_missing"}

    client = boto3.client("athena", region_name=REGION)
    results: dict = {"tables": {}}

    for table in tables:
        sql = f"MSCK REPAIR TABLE {DATABASE}.{table}"
        t0 = time.perf_counter()
        try:
            qid = _run_athena_ddl(client, sql)
            dt = round(time.perf_counter() - t0, 3)
            ctx.event(
                "partition_register_ok",
                table=table,
                query_id=qid,
                duration_s=dt,
            )
            results["tables"][table] = {"status": "ok", "query_id": qid, "duration_s": dt}
        except Exception as exc:
            dt = round(time.perf_counter() - t0, 3)
            ctx.event(
                "partition_register_failed",
                level="ERROR",
                table=table,
                error=repr(exc),
                duration_s=dt,
            )
            results["tables"][table] = {"status": "error", "error": str(exc), "duration_s": dt}

    return results
