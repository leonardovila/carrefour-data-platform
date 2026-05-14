"""
Cleanup de particiones locales en el VPS.

Una vez que la particion esta en S3 + registrada en Glue, el .parquet
local es redundante. En un VPS chico (1 GB de disco util) acumular
particiones diarias eternamente termina llenando el disco.

Politica: conservar las ultimas N particiones locales (default 7 dias)
y borrar el resto. Las particiones viejas siguen disponibles en S3.
"""
from __future__ import annotations
from pathlib import Path

from carrefour_etl.observability.run_context import RunContext


def _list_partition_dirs(bronze_dir: Path) -> list[Path]:
    if not bronze_dir.exists():
        return []
    out: list[Path] = []
    for child in bronze_dir.iterdir():
        if child.is_dir() and child.name.startswith("ingest_date="):
            out.append(child)
    # Orden ascendente por fecha (la fecha vive en el nombre del dir).
    out.sort(key=lambda p: p.name)
    return out


def _dir_size_bytes(d: Path) -> int:
    total = 0
    for f in d.rglob("*"):
        if f.is_file():
            try:
                total += f.stat().st_size
            except OSError:
                pass
    return total


def cleanup_old_local_partitions(
    ctx: RunContext,
    bronze_dirs: list[Path],
    keep_last_n: int = 7,
) -> dict:
    """
    Para cada dataset (products_raw, categories_raw) borra las particiones
    locales mas viejas dejando solo las ultimas `keep_last_n`.

    Idempotente: si ya hay <= keep_last_n, no toca nada.
    Defensivo: nunca borra la particion mas reciente, aunque keep_last_n=0.
    """
    summary: dict = {"datasets": {}, "kept_per_dataset": keep_last_n}
    effective_keep = max(1, keep_last_n)

    for bronze_dir in bronze_dirs:
        partitions = _list_partition_dirs(bronze_dir)
        if not partitions:
            summary["datasets"][bronze_dir.name] = {"present": 0, "deleted": 0, "freed_bytes": 0}
            continue

        to_delete = partitions[:-effective_keep] if len(partitions) > effective_keep else []
        deleted = 0
        freed = 0
        for part_dir in to_delete:
            size = _dir_size_bytes(part_dir)
            try:
                for f in part_dir.rglob("*"):
                    if f.is_file():
                        f.unlink()
                # Borrar subdirs vacios + el dir de particion
                for sub in sorted(part_dir.rglob("*"), reverse=True):
                    if sub.is_dir():
                        try:
                            sub.rmdir()
                        except OSError:
                            pass
                part_dir.rmdir()
                deleted += 1
                freed += size
                ctx.event(
                    "local_partition_deleted",
                    dataset=bronze_dir.name,
                    partition=part_dir.name,
                    bytes_freed=size,
                )
            except Exception as exc:
                ctx.event(
                    "local_partition_delete_failed",
                    level="WARNING",
                    dataset=bronze_dir.name,
                    partition=part_dir.name,
                    error=repr(exc),
                )

        summary["datasets"][bronze_dir.name] = {
            "present": len(partitions),
            "deleted": deleted,
            "freed_bytes": freed,
        }

    return summary
