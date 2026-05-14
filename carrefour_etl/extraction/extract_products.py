from __future__ import annotations
import asyncio
import base64
import json
import random
from pathlib import Path
from typing import Any, Callable, Optional

from curl_cffi.requests import AsyncSession

from carrefour_etl.observability.run_context import RunContext

GRAPHQL_URL = "https://www.carrefour.com.ar/_v/segment/graphql/v1"
PERSISTED_HASH = "ee2478d319404f621c3e0426e79eba3997665d48cb277a53bf0c3276e8e53c22"

PAGE_SIZE = 50
MAX_PAGES_PER_CATEGORY = 50           # cap defensivo: 2500 productos por cat
INTER_PAGE_DELAY_BASE = 0.3
MAX_RETRIES = 4
CONCURRENT_CATEGORIES = 5

HEADERS_BASE = {
    "accept": "*/*",
    "accept-language": "es-AR,es;q=0.9",
    "content-type": "application/json",
    "origin": "https://www.carrefour.com.ar",
    "referer": "https://www.carrefour.com.ar/",
}


class FatalScrapeError(Exception):
    """Error que NO debe reintentarse (payload mal armado, 500 persistente)."""


def _build_params(category_id: int | str, from_idx: int, to_idx: int) -> dict[str, str]:
    inner_vars = {
        "hideUnavailableItems": False,
        "skusFilter": "ALL_AVAILABLE",
        "installmentCriteria": "MAX_WITHOUT_INTEREST",
        "category": str(category_id),
        "collection": "",
        "specificationFilters": [],
        "orderBy": "OrderByTopSaleDESC",
        "from": from_idx,
        "to": to_idx,
        "shippingOptions": [],
        "variant": "null-null",
        "advertisementOptions": {
            "showSponsored": False,
            "sponsoredCount": 0,
            "repeatSponsoredProducts": False,
            "advertisementPlacement": "home_shelf",
        },
    }
    inner_json = json.dumps(inner_vars, separators=(",", ":"))
    b64 = base64.b64encode(inner_json.encode("utf-8")).decode("utf-8")

    extensions = {
        "persistedQuery": {
            "version": 1,
            "sha256Hash": PERSISTED_HASH,
            "sender": "vtex.store-resources@0.x",
            "provider": "vtex.search-graphql@0.x",
        },
        "variables": b64,
    }

    return {
        "workspace": "master",
        "maxAge": "short",
        "appsEtag": "remove",
        "domain": "store",
        "locale": "es-AR",
        "operationName": "Products",
        "variables": "{}",
        "extensions": json.dumps(extensions, separators=(",", ":")),
    }


async def _fetch_page(
    session: AsyncSession,
    ctx: RunContext,
    category_filter: str,
    category_id_for_log: str,
    from_idx: int,
    to_idx: int,
) -> list[dict[str, Any]]:
    """
    `category_filter` = path slug usado por VTEX (ej "electro-y-tecnologia/.../smart-tv").
    `category_id_for_log` = ID numerico para tracking/observabilidad/checkpoint.
    """
    params = _build_params(category_filter, from_idx, to_idx)
    delay = 1.5

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = await session.get(
                GRAPHQL_URL,
                params=params,
                headers=HEADERS_BASE,
                timeout=25,
            )

            if response.status_code == 200:
                data = response.json()
                if "errors" in data:
                    ctx.event(
                        "graphql_error_payload",
                        level="WARNING",
                        category_id=category_id_for_log,
                        from_idx=from_idx,
                        errors=data["errors"][:2],
                    )
                    return []
                return data.get("data", {}).get("products", []) or []

            if response.status_code in (429, 502, 503, 504):
                ctx.event(
                    "transient_http_retry",
                    level="WARNING",
                    category_id=category_id_for_log,
                    status=response.status_code,
                    attempt=attempt,
                    sleep_s=delay,
                )
                await asyncio.sleep(delay + random.uniform(0, 0.5))
                delay *= 2
                continue

            if response.status_code == 403:
                ctx.event(
                    "waf_block_retry",
                    level="WARNING",
                    category_id=category_id_for_log,
                    attempt=attempt,
                )
                await asyncio.sleep(delay * 2 + random.uniform(0, 1))
                delay *= 2
                continue

            if response.status_code == 500:
                # Payload mal armado: NO reintentar, fail fast
                raise FatalScrapeError(
                    f"HTTP 500 cat={category_id_for_log} page={from_idx}-{to_idx}"
                )

            raise FatalScrapeError(
                f"HTTP {response.status_code} cat={category_id_for_log}: {response.text[:200]}"
            )

        except FatalScrapeError:
            raise
        except Exception as exc:
            ctx.event(
                "request_exception_retry",
                level="WARNING",
                category_id=category_id_for_log,
                attempt=attempt,
                error=repr(exc),
            )
            await asyncio.sleep(delay)
            delay *= 2

    raise FatalScrapeError(
        f"Retries exhausted cat={category_id_for_log} page={from_idx}-{to_idx}"
    )


def _load_checkpoint(path: Path, run_id: str) -> dict[str, Any]:
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            data["run_id"] = run_id
            return data
        except json.JSONDecodeError:
            pass
    return {"run_id": run_id, "categories": {}}


def _persist_checkpoint(checkpoint: dict[str, Any], path: Path) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(checkpoint, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


async def _extract_one_category(
    session: AsyncSession,
    ctx: RunContext,
    category: dict[str, Any],
    semaphore: asyncio.Semaphore,
    checkpoint: dict[str, Any],
    checkpoint_path: Path,
    checkpoint_lock: asyncio.Lock,
    on_done: "Callable[[dict, list[dict]], None] | None" = None,
) -> tuple[list[dict[str, Any]], str]:
    cat_id = str(category["id"])
    cat_name = category.get("name", "?")
    cat_path = category.get("path") or cat_id  # VTEX exige path; ID es solo para tracking

    cat_state = checkpoint["categories"].get(cat_id, {})
    if cat_state.get("status") == "done":
        ctx.event(
            "category_skipped_checkpoint",
            category_id=cat_id,
            previous_count=cat_state.get("products_collected"),
        )
        return [], "done"

    if cat_state.get("status") == "partial":
        from_idx = int(cat_state.get("last_to", -1)) + 1
    else:
        from_idx = 0
    to_idx = from_idx + PAGE_SIZE - 1
    products: list[dict[str, Any]] = []
    page = from_idx // PAGE_SIZE

    async with semaphore:
        ctx.event("category_start", category_id=cat_id, category_name=cat_name, from_offset=from_idx)
        try:
            while page < MAX_PAGES_PER_CATEGORY:
                page += 1
                page_products = await _fetch_page(session, ctx, cat_path, cat_id, from_idx, to_idx)

                if not page_products:
                    break

                products.extend(page_products)

                if len(page_products) < PAGE_SIZE:
                    break

                from_idx += PAGE_SIZE
                to_idx += PAGE_SIZE
                await asyncio.sleep(INTER_PAGE_DELAY_BASE + random.uniform(0, 0.3))

            async with checkpoint_lock:
                checkpoint["categories"][cat_id] = {
                    "status": "done",
                    "products_collected": len(products),
                    "pages_scanned": page,
                }
                _persist_checkpoint(checkpoint, checkpoint_path)

            ctx.event(
                "category_complete",
                category_id=cat_id,
                category_name=cat_name,
                products_collected=len(products),
                pages=page,
            )
            if on_done is not None:
                try:
                    on_done(category, products)
                except Exception as exc:
                    ctx.event(
                        "on_done_callback_failed",
                        level="WARNING",
                        category_id=cat_id,
                        error=repr(exc),
                    )
                # Liberar memoria: ya se persistio, no necesitamos retornarlo
                count = len(products)
                products = []
                return count, "done"  # type: ignore[return-value]
            return products, "done"

        except FatalScrapeError as exc:
            async with checkpoint_lock:
                checkpoint["categories"][cat_id] = {
                    "status": "error",
                    "products_collected": len(products),
                    "last_to": from_idx - 1,
                    "last_error": str(exc),
                }
                _persist_checkpoint(checkpoint, checkpoint_path)
            ctx.event(
                "category_failed",
                level="ERROR",
                category_id=cat_id,
                category_name=cat_name,
                error=str(exc),
                products_collected_partial=len(products),
            )
            if on_done is not None:
                # Persistir lo parcial tambien (mejor algo que nada)
                if products:
                    try:
                        on_done(category, products)
                    except Exception:
                        pass
                count = len(products)
                products = []
                return count, "error"  # type: ignore[return-value]
            return products, "error"


async def extract_all_products(
    ctx: RunContext,
    categories: list[dict[str, Any]],
    checkpoint_path: Path,
    on_category_done: "Callable[[dict, list[dict]], None] | None" = None,
) -> dict[str, Any]:
    """
    Modo streaming: si se pasa `on_category_done`, se invoca despues de cada categoria
    y los productos se descartan del proceso (no se acumulan). Esto evita OOM en VPS chicos.

    Sin `on_category_done`: comportamiento legacy, acumula todo en memoria y lo devuelve
    bajo la clave "enriched_products" del summary (cuidado con OOM).

    Devuelve summary del run.
    """
    semaphore = asyncio.Semaphore(CONCURRENT_CATEGORIES)
    checkpoint_lock = asyncio.Lock()
    checkpoint = _load_checkpoint(checkpoint_path, ctx.run_id)

    summary: dict[str, Any] = {
        "categories_done": 0,
        "categories_error": 0,
        "categories_total": len(categories),
        "total_product_observations": 0,
        "unique_product_ids": 0,
    }
    legacy_buffer: list[tuple[dict[str, Any], dict[str, Any]]] = []
    seen_ids: set[str] = set()

    def _accumulator(cat: dict, products: list[dict]) -> None:
        for p in products:
            legacy_buffer.append((cat, p))
            pid = str(p.get("productId") or "")
            if pid:
                seen_ids.add(pid)

    def _streaming_wrapper(cat: dict, products: list[dict]) -> None:
        # Invoca el user callback y ademas mantiene contadores sin acumular productos
        for p in products:
            pid = str(p.get("productId") or "")
            if pid:
                seen_ids.add(pid)
        on_category_done(cat, products)  # type: ignore[misc]

    callback = _streaming_wrapper if on_category_done is not None else _accumulator

    async with AsyncSession(impersonate="chrome110") as session:
        tasks = [
            _extract_one_category(
                session, ctx, cat, semaphore, checkpoint, checkpoint_path,
                checkpoint_lock, on_done=callback,
            )
            for cat in categories
        ]
        results = await asyncio.gather(*tasks, return_exceptions=False)

    total_obs = 0
    for cat, (result, status) in zip(categories, results):
        if status == "done":
            summary["categories_done"] += 1
        elif status == "error":
            summary["categories_error"] += 1
        # En streaming `result` es int (count). En legacy es list.
        if on_category_done is None:
            total_obs += len(result) if isinstance(result, list) else 0
        else:
            total_obs += result if isinstance(result, int) else 0

    if on_category_done is None:
        summary["total_product_observations"] = len(legacy_buffer)
        summary["unique_product_ids"] = len(seen_ids)
        summary["enriched_products"] = legacy_buffer  # type: ignore[assignment]
    else:
        summary["total_product_observations"] = total_obs
        summary["unique_product_ids"] = len(seen_ids)

    ctx.event("extraction_summary", **{k: v for k, v in summary.items() if k != "enriched_products"})
    return summary
