from __future__ import annotations
import re
from typing import Any

import requests

from carrefour_etl.observability.run_context import RunContext

CATEGORY_TREE_URL = "https://www.carrefour.com.ar/api/catalog_system/pub/category/tree/{depth}"
SITE_URL_PREFIX = "https://www.carrefour.com.ar/"

DIRTY_NAME_PATTERNS = [
    re.compile(r"\(no se usa\)", re.IGNORECASE),
    re.compile(r"^test\b", re.IGNORECASE),
    re.compile(r"sandbox", re.IGNORECASE),
    re.compile(r"deprecated", re.IGNORECASE),
    re.compile(r"^_", re.IGNORECASE),
]
DIRTY_IDS: set[int] = {1}

HEADERS = {
    "accept": "application/json",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}


def _url_to_path(url: str | None) -> str:
    """
    VTEX exige el slug del path como filtro `category` en el query Products,
    no el ID numerico. Ej: 'electro-y-tecnologia/tv-y-soportes/smart-tv'.
    """
    if not url:
        return ""
    if url.startswith(SITE_URL_PREFIX):
        return url[len(SITE_URL_PREFIX):].rstrip("/")
    return url.lstrip("/").rstrip("/")


def _is_clean(node: dict[str, Any]) -> bool:
    if node.get("id") in DIRTY_IDS:
        return False
    name = node.get("name", "") or ""
    if not name.strip():
        return False
    return not any(p.search(name) for p in DIRTY_NAME_PATTERNS)


def _walk_leaves(node: dict[str, Any], leaves: list[dict[str, Any]], dropped: list[dict[str, Any]]) -> None:
    if node.get("hasChildren") and node.get("children"):
        for child in node["children"]:
            _walk_leaves(child, leaves, dropped)
    else:
        if _is_clean(node):
            url = node.get("url")
            path = _url_to_path(url)
            if not path:
                dropped.append({"id": node.get("id"), "name": node.get("name"), "reason": "no_path"})
                return
            leaves.append({
                "id": node.get("id"),
                "name": node.get("name"),
                "url": url,
                "path": path,
            })
        else:
            dropped.append({"id": node.get("id"), "name": node.get("name"), "reason": "dirty_name_or_id"})


def discover_leaf_categories(ctx: RunContext, depth: int = 3) -> list[dict[str, Any]]:
    url = CATEGORY_TREE_URL.format(depth=depth)
    ctx.event("category_tree_request", stage="discover_categories", url=url, depth=depth)

    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    tree = response.json()

    leaves: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []
    for root in tree:
        _walk_leaves(root, leaves, dropped)

    ctx.event(
        "discovery_complete",
        stage="discover_categories",
        roots_scanned=len(tree),
        leaf_categories_clean=len(leaves),
        leaf_categories_dropped=len(dropped),
        sample_dropped=dropped[:5],
    )
    return leaves
