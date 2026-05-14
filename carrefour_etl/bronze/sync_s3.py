from __future__ import annotations
from pathlib import Path
from typing import Any

from carrefour_etl.observability.run_context import RunContext


def upload_file_to_s3(
    ctx: RunContext,
    local_file: Path,
    bucket: str,
    key: str,
) -> bool:
    """Sube un solo archivo a S3. Para escritura incremental (cat por cat)."""
    if not bucket:
        return False
    try:
        import boto3
    except ImportError:
        ctx.event("s3_upload_skipped", level="WARNING", reason="boto3_missing")
        return False
    try:
        boto3.client("s3").upload_file(
            str(local_file), bucket, key,
            ExtraArgs={"ContentType": "application/octet-stream"},
        )
        ctx.event("s3_object_uploaded", bucket=bucket, key=key, bytes=local_file.stat().st_size)
        return True
    except Exception as e:
        ctx.event("s3_upload_failed", level="ERROR", bucket=bucket, key=key, error=repr(e))
        return False


def sync_partition_to_s3(
    ctx: RunContext,
    local_partition_dir: Path,
    bucket: str,
    prefix: str,
    dataset: str,
) -> dict[str, Any]:
    """
    Sube los .parquet de una particion al bucket.
    Mantiene el layout local en S3:  s3://<bucket>/<prefix>/<dataset>/ingest_date=.../*.parquet
    """
    if not bucket:
        ctx.event("s3_sync_skipped", reason="no_bucket_configured", dataset=dataset)
        return {"uploaded": 0, "skipped": True}

    try:
        import boto3
    except ImportError:
        ctx.event("s3_sync_skipped", level="ERROR", reason="boto3_not_installed", dataset=dataset)
        return {"uploaded": 0, "skipped": True, "error": "boto3_missing"}

    if not local_partition_dir.exists():
        ctx.event("s3_sync_skipped", reason="no_local_data", dataset=dataset, path=str(local_partition_dir))
        return {"uploaded": 0, "skipped": True}

    client = boto3.client("s3")
    uploaded = 0
    total_bytes = 0
    partition_name = local_partition_dir.name

    for parquet_file in sorted(local_partition_dir.glob("*.parquet")):
        s3_key = f"{prefix.rstrip('/')}/{dataset}/{partition_name}/{parquet_file.name}"
        client.upload_file(
            str(parquet_file),
            bucket,
            s3_key,
            ExtraArgs={"ContentType": "application/octet-stream"},
        )
        size = parquet_file.stat().st_size
        uploaded += 1
        total_bytes += size
        ctx.event(
            "s3_object_uploaded",
            bucket=bucket,
            key=s3_key,
            bytes=size,
        )

    ctx.event(
        "s3_sync_complete",
        bucket=bucket,
        dataset=dataset,
        partition=partition_name,
        files_uploaded=uploaded,
        total_bytes=total_bytes,
    )
    return {"uploaded": uploaded, "total_bytes": total_bytes, "skipped": False}
