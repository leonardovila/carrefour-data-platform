"""
Corre queries de validacion sobre cada view del star schema.
Imprime un sample para confirmar que devuelven data.
"""
from __future__ import annotations
import json
import time
from pathlib import Path

import boto3

WORKGROUP = "carrefour-wg"
DATABASE = "carrefour_bronze"
REGION = "us-east-2"

QUERIES = {
    "termometro_gondola": "SELECT * FROM mart_termometro_gondola LIMIT 5",
    "top_marcas": "SELECT * FROM mart_top_marcas_gondola LIMIT 5",
    "ofertas_del_dia": "SELECT producto, marca, precio_lista, precio_venta, descuento_pct FROM mart_ofertas_del_dia LIMIT 5",
    "carrefour_vs_lider": "SELECT categoria, producto_carrefour, precio_carrefour, marca_competencia, precio_competencia, te_ahorras_pct FROM mart_carrefour_vs_lider LIMIT 5",
    "lo_que_mas_bajo_semana": "SELECT * FROM mart_lo_que_mas_bajo_esta_semana LIMIT 5",
    "marcas_que_mas_aumentan": "SELECT * FROM mart_marcas_que_mas_aumentan LIMIT 5",
    "dim_marca_resumen": "SELECT count(*) marcas, sum(productos_disponibles) productos FROM dim_marca",
    "fact_resumen": "SELECT count(*) observaciones, count(distinct producto_id) productos_unicos, count(distinct fecha) dias FROM fact_observacion_diaria WHERE esta_disponible",
}


def run(athena, sql: str) -> tuple[list[str], list[list]]:
    resp = athena.start_query_execution(
        QueryString=sql,
        QueryExecutionContext={"Database": DATABASE},
        WorkGroup=WORKGROUP,
    )
    qid = resp["QueryExecutionId"]
    while True:
        st = athena.get_query_execution(QueryExecutionId=qid)["QueryExecution"]["Status"]
        if st["State"] in ("SUCCEEDED", "FAILED", "CANCELLED"):
            break
        time.sleep(0.5)
    if st["State"] != "SUCCEEDED":
        raise RuntimeError(f"{st['State']}: {st.get('StateChangeReason', '')}")

    res = athena.get_query_results(QueryExecutionId=qid)["ResultSet"]
    rows_raw = res["Rows"]
    if not rows_raw:
        return [], []
    headers = [c.get("VarCharValue", "") for c in rows_raw[0]["Data"]]
    rows = [
        [c.get("VarCharValue", "") for c in r["Data"]]
        for r in rows_raw[1:]
    ]
    return headers, rows


def main() -> None:
    athena = boto3.client("athena", region_name=REGION)
    output: dict = {}

    for label, sql in QUERIES.items():
        print(f"\n=== {label} ===")
        try:
            headers, rows = run(athena, sql)
            output[label] = {"headers": headers, "rows": rows, "count": len(rows)}
            if not rows:
                print("  (vacio — sera util cuando haya mas particiones)")
            else:
                widths = [max(len(h), max((len(r[i]) for r in rows), default=0)) for i, h in enumerate(headers)]
                print("  " + " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers)))
                print("  " + "-+-".join("-" * w for w in widths))
                for r in rows:
                    print("  " + " | ".join(r[i].ljust(widths[i]) for i in range(len(headers))))
        except Exception as e:
            output[label] = {"error": str(e)}
            print(f"  ERROR: {e}")

    out_path = Path(__file__).resolve().parents[1] / "infra" / "marts_sample.json"
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSample guardado en {out_path}")


if __name__ == "__main__":
    main()
