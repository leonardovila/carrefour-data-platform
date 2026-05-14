"""
Aplica todas las views/queries SQL del directorio sql/ a Athena.
Idempotente: usa CREATE OR REPLACE VIEW.

Uso:
    python scripts/apply_sql.py
"""
from __future__ import annotations
import json
import sys
import time
from pathlib import Path

import boto3

WORKGROUP = "carrefour-wg"
DATABASE = "carrefour_bronze"
REGION = "us-east-2"

SQL_DIR = Path(__file__).resolve().parents[1] / "sql"
# Orden: silver primero, luego dims, luego fact, luego marts
APPLY_ORDER = [
    "silver_productos.sql",
    "dim_marca.sql",
    "dim_categoria.sql",
    "dim_fecha.sql",
    "fact_observacion_diaria.sql",
    "mart_termometro_gondola.sql",
    "mart_ofertas_del_dia.sql",
    "mart_top_marcas_gondola.sql",
    "mart_lo_que_mas_bajo_esta_semana.sql",
    "mart_marcas_que_mas_aumentan.sql",
    "mart_carrefour_vs_lider.sql",
]


def run_query(athena, sql: str, label: str) -> str:
    resp = athena.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={"Database": DATABASE},
        WorkGroup=WORKGROUP,
    )
    qid = resp["QueryExecutionId"]
    while True:
        st = athena.get_query_execution(QueryExecutionId=qid)["QueryExecution"]["Status"]
        state = st["State"]
        if state in ("SUCCEEDED", "FAILED", "CANCELLED"):
            break
        time.sleep(1)
    if state != "SUCCEEDED":
        reason = st.get("StateChangeReason", "")
        raise RuntimeError(f"[{label}] {state}: {reason}")
    return qid


def main() -> int:
    athena = boto3.client("athena", region_name=REGION)
    results: list[dict] = []
    for fname in APPLY_ORDER:
        path = SQL_DIR / fname
        if not path.exists():
            results.append({"file": fname, "status": "missing"})
            continue
        sql = path.read_text(encoding="utf-8")
        try:
            qid = run_query(athena, sql, fname)
            results.append({"file": fname, "status": "ok", "query_id": qid})
            print(f"[OK]   {fname}  ({qid})")
        except Exception as e:
            results.append({"file": fname, "status": "error", "error": str(e)})
            print(f"[FAIL] {fname}  {e}")

    summary_path = Path(__file__).resolve().parents[1] / "infra" / "apply_sql_result.json"
    summary_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nResumen guardado en {summary_path}")

    return 0 if all(r["status"] == "ok" for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
