# Carrefour Argentina — Price Intelligence Platform

**Live:** [www.leonardovila.com/carrefour-data](https://www.leonardovila.com/carrefour-data/)

An end-to-end data pipeline that ingests the entire online catalog of Carrefour Argentina every night, builds a star schema in the cloud, and serves a real-time analytics dashboard. The system runs autonomously on a cron schedule — no manual intervention required.

> ~20,000 products · 1,900+ brands · 410 categories · 107,000 daily observations · new partition every night at 03:30 ART

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         VPS (DigitalOcean NYC)                        │
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐              │
│  │  Discovery   │───▸│  Extraction  │───▸│ Bronze Write │              │
│  │  (VTEX API)  │    │  (curl_cffi) │    │  (PyArrow)   │              │
│  └─────────────┘    └─────────────┘    └──────┬───────┘              │
│                                                │                      │
│                          ┌─────────────────────┤                      │
│                          ▼                     ▼                      │
│                   ┌────────────┐       ┌──────────────┐              │
│                   │  S3 Upload  │       │ Local Parquet │              │
│                   │ (streaming) │       │  (7-day TTL)  │              │
│                   └──────┬─────┘       └──────┬───────┘              │
│                          │                     │                      │
│                          ▼                     ▼                      │
│                   ┌────────────┐       ┌──────────────┐              │
│                   │   MSCK      │       │   FastAPI     │              │
│                   │   REPAIR    │       │   + DuckDB    │◂── nginx    │
│                   │   TABLE     │       │   :8002       │    reverse  │
│                   └──────┬─────┘       └──────┬───────┘    proxy     │
│                          │                     │                      │
└──────────────────────────┼─────────────────────┼──────────────────────┘
                           │                     │
                           ▼                     │
┌──────────────────────────────────────┐         │
│            AWS (us-east-2)           │         │
│                                      │         │
│  S3 ───▸ Glue Catalog ───▸ Athena    │         │
│  (bronze)  (auto-partition)  (views) │◂────────┘
│                                      │    cloud_routes.py
│  ┌──────────────────────────────┐    │    queries Athena
│  │  11 SQL views (star schema)  │    │    on every request
│  │  silver → dims → fact → marts│    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │   React 19 + Vite  │
         │   Dashboard (SPA)  │
         └────────────────────┘
```

---

## Pipeline Stages

The pipeline is orchestrated by `main_runner.py` and runs as a single async process every night via cron.

### 1. Category Discovery

Fetches the full VTEX category tree (depth 3) from Carrefour Argentina's public API. Walks the tree to extract leaf categories, filtering out test nodes, deprecated entries, and internal placeholders. Currently discovers **444 leaf categories** per run.

### 2. Product Extraction

Hits the VTEX GraphQL endpoint concurrently across 5 categories at a time, paginating 50 products per request. Uses `curl_cffi` with TLS fingerprint impersonation (`chrome124`) to present a browser-grade TLS handshake — necessary because Carrefour sits behind Cloudflare. Failed categories retry with exponential backoff up to 4 attempts. A safety valve aborts if more than 30% of categories fail.

### 3. Streaming Bronze Write

Each category's products are flattened and written to Parquet immediately upon extraction — not buffered in memory. This is a deliberate design choice: the VPS has 1 GB of RAM, so holding 20,000+ product payloads in memory would OOM the process. PyArrow writes each category as an individual `.parquet` file with zstd compression into Hive-partitioned directories (`ingest_date=YYYY-MM-DD/`).

The Parquet schema carries 30 columns: identity, pricing (list/selling/discount), availability, installment terms, seller info, EAN barcodes, category lineage, image URLs, and the raw JSON payload as an escape hatch.

### 4. S3 Upload

Each Parquet file is uploaded to S3 immediately after being written locally — streaming, not batched. This means even a partial run (killed mid-extraction) produces a usable partial partition in the lake. The S3 layout mirrors the local Hive structure: `s3://<bucket>/bronze/products_raw/ingest_date=YYYY-MM-DD/*.parquet`.

### 5. Partition Registration

After upload, the pipeline runs `MSCK REPAIR TABLE` against Athena for both `products_raw` and `categories_raw`. This DDL command is free (no data scanned), idempotent, and tells the Glue Data Catalog about every new partition directory in S3. Without this step, Athena would only see partitions from the initial Glue crawler run.

### 6. Local Cleanup

The VPS keeps only the last 7 daily partitions on disk. Older data is pruned to conserve the small local drive. The full history lives permanently in S3 with versioning enabled, and Glacier IR transitions kick in after 30 days for noncurrent versions.

---

## Star Schema

All analytical queries run against Athena views — zero materialized tables, zero storage cost beyond the bronze Parquet files. The schema follows a classic dimensional model:

```
                    ┌─────────────────────┐
                    │    products_raw      │  (Glue external table over S3 Parquet)
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   silver_productos   │  (cleaned, Spanish column names)
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐
     │   dim_marca   │ │ dim_fecha  │ │dim_categoria │
     │               │ │            │ │              │
     │ private label │ │ day of week│ │ path / URL   │
     │ brand profile │ │ weekday    │ │              │
     └───────────────┘ └────────────┘ └──────────────┘
                              │
                    ┌─────────▼───────────┐
                    │fact_observacion_diaria│  (one row per product per day)
                    └─────────┬───────────┘
                              │
        ┌─────────┬───────────┼───────────┬──────────────┐
        │         │           │           │              │
   ┌────▼───┐ ┌──▼────┐ ┌────▼───┐ ┌─────▼────┐ ┌──────▼──────┐
   │Termome-│ │Ofertas│ │Lo que  │ │Carrefour │ │Marcas que   │
   │tro de  │ │del Día│ │más bajó│ │vs Líder  │ │más aumentan │
   │Góndola │ │       │ │semana  │ │          │ │             │
   └────────┘ └───────┘ └────────┘ └──────────┘ └─────────────┘
                                        │
                                   ┌────▼────┐
                                   │Top Marcas│
                                   │ Góndola  │
                                   └─────────┘
```

### Narrative Marts

| Mart | What it answers |
|---|---|
| **mart_termometro_gondola** | Daily pulse: total available products, active brands, categories with stock, average/median price, total savings available from promotions. One row per ingested day. |
| **mart_ofertas_del_dia** | Today's best deals. Products with real discounts above 15%, ranked by discount depth and absolute savings. |
| **mart_lo_que_mas_bajo_esta_semana** | Products whose selling price dropped compared to 7 days ago. Requires at least two partitions spanning a week — returns empty gracefully when there's not enough history. |
| **mart_carrefour_vs_lider** | Per-category comparison: cheapest Carrefour-branded product vs. cheapest competing brand. Surfaces how much a consumer saves by choosing private label. |
| **mart_top_marcas_gondola** | Brand ranking by product count, with average price, price range, and promotion rate. |
| **mart_marcas_que_mas_aumentan** | Brands with the highest average weekly price increase, filtered to brands with 5+ comparable products to reduce noise. |

---

## Infrastructure

| Component | Detail |
|---|---|
| **Compute** | DigitalOcean VPS (NYC), 1 vCPU / 1 GB RAM |
| **Ingestion schedule** | cron at 03:30 ART (06:30 UTC), daily, systemd service `carrefour-api` |
| **Object storage** | S3 bucket with versioning, SSE-S3 encryption, public access blocked |
| **Data catalog** | AWS Glue database `carrefour_bronze`, two external tables |
| **Query engine** | Athena workgroup `carrefour-wg`, results stored in same bucket (`athena-results/`, 30-day TTL) |
| **Lifecycle** | Noncurrent S3 versions transition to Glacier IR, then expire per policy |
| **IaC** | Terraform manages the entire AWS footprint: S3, IAM user + policy, Glue database/crawler, Athena workgroup |
| **Reverse proxy** | nginx on the VPS, serves the SPA at `/carrefour-data/` and proxies API calls to `localhost:8002` |
| **API** | FastAPI (uvicorn), stateless. DuckDB for local parquet queries, boto3 for Athena cloud queries |
| **Frontend** | React 19, Vite, Tailwind CSS v4. SPA with live Athena-backed data sections |

---

## API Layer

The FastAPI application exposes two query paths:

**Local endpoints** (DuckDB reads parquet files on disk):
- `GET /system/status` — partition inventory, product/brand/category counts per day
- `GET /products` — paginated product listing with filters (brand, seller, category, availability)
- `GET /products/{id}` — full product detail including raw installment and teaser data
- `GET /catalog/brands` — brand ranking with price statistics
- `GET /catalog/categories` — full category listing for the latest partition

**Cloud endpoints** (Athena queries against the star schema):
- `GET /cloud/termometro` — daily catalog pulse
- `GET /cloud/ofertas-del-dia` — top discounts above 15%
- `GET /cloud/lo-que-mas-bajo-semana` — weekly price drops
- `GET /cloud/carrefour-vs-lider` — private label vs. competitor comparison
- `GET /cloud/top-marcas` — brand ranking by shelf presence
- `GET /cloud/marcas-que-mas-aumentan` — brands with highest weekly inflation
- `GET /cloud/dim-marca` — dimension table: brand profiles with aggregated metrics

---

## Dashboard Sections

The frontend consumes the cloud endpoints and renders six analytical views:

1. **Hero Panel** — real-time KPIs: total products, active brands, available offers. Live UTC clock and pipeline run ID.
2. **Termometro de Gondola** — daily snapshot metrics pulled from `mart_termometro_gondola`.
3. **Ofertas del Dia** — scrollable card grid of today's deepest discounts, with product images, prices, and direct links to Carrefour's product pages.
4. **Lo Que Mas Bajo Esta Semana** — products that dropped in price over the last 7 days, showing before/after and percentage change.
5. **Carrefour vs Lider** — side-by-side comparison of Carrefour private label vs. leading brand, per category.
6. **Top Marcas** — brand leaderboard ranked by product count, with a per-brand breakdown of price range and promotion rate.

---

## Observability

Every pipeline run produces two artifacts:

- **JSONL event log** — one structured JSON line per event (stage start, stage end, S3 uploads, partition registrations, errors). Machine-parseable, append-only.
- **JSON run report** — summary document with per-stage status, durations, error counts, and final disposition (`success` / `error`).

The `RunContext` class provides a `span()` context manager that automatically tracks stage durations and catches exceptions, producing consistent telemetry without boilerplate.

---

## Key Engineering Decisions

| Decision | Rationale |
|---|---|
| **curl_cffi over requests/httpx** | Carrefour's Cloudflare protection rejects standard Python TLS fingerprints. `curl_cffi` impersonates a real Chrome TLS handshake at the socket level. |
| **Streaming write (per-category Parquet)** | The VPS has 1 GB RAM. Buffering 20k products would OOM. Writing one Parquet file per category keeps peak memory under ~80 MB. |
| **MSCK REPAIR TABLE over Glue crawler schedule** | The Glue crawler is event-driven only (manual or on-demand). MSCK REPAIR is free DDL that registers new Hive partitions instantly post-ingest. |
| **Views-only star schema** | Zero storage cost. Every mart is a SQL view over the bronze Parquet in S3. Athena scans only the partitions and columns needed. |
| **DuckDB for local queries** | Instant startup, reads Parquet natively with Hive partitioning, no daemon process. One connection per request avoids thread-safety issues. |
| **7-day local retention** | The VPS disk is small. Old partitions are pruned after S3 sync. The full history lives in S3 with versioning and Glacier lifecycle. |
| **No cache layer** | Athena mart queries scan a few MB of columnar data and return in 1-2 seconds. Adding Redis/memcached would increase complexity without meaningful latency improvement at this scale. |

---

## Stack

`Python 3.11` · `asyncio` · `curl_cffi` · `PyArrow` · `DuckDB` · `boto3` · `FastAPI` · `uvicorn` · `React 19` · `Vite` · `Tailwind CSS v4` · `Zustand` · `Terraform` · `AWS S3` · `AWS Glue` · `AWS Athena` · `nginx` · `systemd`

---

Built by [Leonardo Vila](https://www.leonardovila.com) · Buenos Aires
