"""
Endpoints `/cloud/*` que consultan Athena en vez del parquet local.
Demuestra la arquitectura "VPS triggers cloud query, cloud reads its own bronze, VPS serves response".

Diseño: stateless. Cada request crea un Athena client liviano. Sin cache para v1
(las queries son baratas y los marts son views, no tablas materializadas).
"""
from __future__ import annotations
import os
import time
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/cloud", tags=["cloud"])

WORKGROUP = os.environ.get("CARREFOUR_ATHENA_WORKGROUP", "carrefour-wg")
DATABASE = os.environ.get("CARREFOUR_GLUE_DATABASE", "carrefour_bronze")
REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-2")


def _run_athena(sql: str, max_wait_s: int = 30) -> list[dict]:
    """Sincronico, espera resultado. Devuelve list de dicts."""
    import boto3
    client = boto3.client("athena", region_name=REGION)
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
            break
        if state in ("FAILED", "CANCELLED"):
            raise HTTPException(502, f"Athena {state}: {st.get('StateChangeReason', '')[:200]}")
        if time.time() > deadline:
            raise HTTPException(504, f"Athena query timeout after {max_wait_s}s (qid={qid})")
        time.sleep(0.5)

    res = client.get_query_results(QueryExecutionId=qid)["ResultSet"]
    rows_raw = res["Rows"]
    if not rows_raw:
        return []
    headers = [c.get("VarCharValue", "") for c in rows_raw[0]["Data"]]
    out: list[dict] = []
    for r in rows_raw[1:]:
        cells = r["Data"]
        out.append({headers[i]: cells[i].get("VarCharValue") for i in range(len(headers))})
    return out


@router.get("/termometro")
def termometro_gondola() -> dict:
    """Pulso global del catalogo: una fila por dia ingestado."""
    rows = _run_athena("SELECT * FROM mart_termometro_gondola")
    return {"source": "athena", "view": "mart_termometro_gondola", "rows": rows}


@router.get("/top-marcas")
def top_marcas(limit: int = Query(20, ge=1, le=100)) -> dict:
    """Ranking de marcas por cantidad de productos disponibles hoy."""
    rows = _run_athena(f"SELECT * FROM mart_top_marcas_gondola LIMIT {limit}")
    return {"source": "athena", "view": "mart_top_marcas_gondola", "rows": rows}


@router.get("/ofertas-del-dia")
def ofertas_del_dia(limit: int = Query(50, ge=1, le=200)) -> dict:
    """Top ofertas disponibles hoy (descuento >= 15%)."""
    rows = _run_athena(
        f"SELECT producto, marca, categoria, precio_lista, precio_venta, "
        f"te_ahorras_ars, descuento_pct, cuotas_max, valor_cuota, vendedor, imagen, url "
        f"FROM mart_ofertas_del_dia LIMIT {limit}"
    )
    return {"source": "athena", "view": "mart_ofertas_del_dia", "rows": rows}


@router.get("/carrefour-vs-lider")
def carrefour_vs_lider(limit: int = Query(50, ge=1, le=200)) -> dict:
    """Por categoria: producto Carrefour mas barato vs lider mas barato."""
    rows = _run_athena(f"SELECT * FROM mart_carrefour_vs_lider LIMIT {limit}")
    return {"source": "athena", "view": "mart_carrefour_vs_lider", "rows": rows}


@router.get("/lo-que-mas-bajo-semana")
def lo_que_mas_bajo_semana(limit: int = Query(50, ge=1, le=200)) -> dict:
    """Productos que bajaron de precio vs hace 7 dias. Vacio sin historia."""
    rows = _run_athena(f"SELECT * FROM mart_lo_que_mas_bajo_esta_semana LIMIT {limit}")
    return {"source": "athena", "view": "mart_lo_que_mas_bajo_esta_semana", "rows": rows}


@router.get("/marcas-que-mas-aumentan")
def marcas_que_mas_aumentan(limit: int = Query(30, ge=1, le=100)) -> dict:
    """Marcas con mayor inflacion semanal. Vacio sin historia."""
    rows = _run_athena(f"SELECT * FROM mart_marcas_que_mas_aumentan LIMIT {limit}")
    return {"source": "athena", "view": "mart_marcas_que_mas_aumentan", "rows": rows}


@router.get("/dim-marca")
def dim_marca(limit: int = Query(100, ge=1, le=500)) -> dict:
    """Dimension marca con perfil agregado."""
    rows = _run_athena(f"SELECT * FROM dim_marca ORDER BY productos_disponibles DESC LIMIT {limit}")
    return {"source": "athena", "view": "dim_marca", "rows": rows}
