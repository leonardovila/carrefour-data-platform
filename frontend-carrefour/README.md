# Carrefour Lab — Frontend

Dashboard React+Vite+TS del proyecto Carrefour ETL. Concept: **laboratorio
científico de mediciones comerciales**. Verde radioactivo, scanlines CRT,
voltímetros analógicos, tubos de ensayo. Diferenciado en estética de los
otros frontends del operador (financial = Bloomberg navy, costco = zinc neutro).

## Stack

- React 19 · Vite 8 · TypeScript 5.9
- Tailwind CSS 4 (con `@theme` para variables)
- Zustand (state global mínimo: el botón de refresh global)
- Cero dependencias de UI library — los componentes "lab" son SVG puro
  o divs con CSS. Es a propósito.

## Estructura

```
src/
├── main.tsx
├── App.tsx                              ErrorBoundary + layout
├── index.css                            Design system completo (variables, animaciones, scanlines)
├── types.ts                             Shapes de los endpoints /cloud/*
├── lib/
│   ├── api.ts                           fetch wrapper con base URL configurable
│   └── format.ts                        money / pct / compactNumber para narrativa AR
├── stores/
│   └── useStore.ts                      Zustand: refreshSeed global
├── hooks/
│   └── useApi.ts                        Hook genérico fetch + loading + error + refresh
└── components/
    ├── lab/                             Piezas reutilizables del concept
    │   ├── ScopeGrid.tsx                Fondo: rejilla osciloscopio + scanline
    │   ├── Beaker.tsx                   Tubo de ensayo SVG con líquido y burbujas
    │   ├── Voltimeter.tsx               KPI como dial analógico con aguja
    │   ├── Centrifuge.tsx               Loader temático (rotando)
    │   ├── PulseCircle.tsx              "señal viva" del header
    │   ├── BlueprintBadge.tsx           Encabezado "EXPERIMENTO N°XX" de cada sección
    │   ├── NeonText.tsx                 Texto con glow
    │   ├── BarPill.tsx                  Mini-barra horizontal animada
    │   └── Ticker.tsx                   Loop horizontal infinito (tipo cinta de bolsa)
    └── sections/
        ├── HeroPanel.tsx                Header con KPIs vivos + ticker + CTA refresh
        ├── NavRail.tsx                  Anclas laterales en desktop
        ├── TermometroSection.tsx        EXP01 — pulso del catálogo (voltímetros)
        ├── OfertasSection.tsx           EXP02 — grid de cards con descuento ≥15%
        ├── TopMarcasSection.tsx         EXP03 — tabla ranking marcas (resalta Carrefour)
        ├── CarrefourVsLiderSection.tsx  EXP04 — duelo lado a lado por categoría
        ├── LoQueBajoSection.tsx         EXP05 — price drops semanales (incuba 7 días)
        ├── Pipeline.tsx                 DOC — narrativa técnica de cómo se construye
        └── Footer.tsx                   Operador + frecuencia + disclaimer
```

## Endpoints que consume

Todos del backend FastAPI del VPS (puerto 8002, mounteado en `/cloud/*`):

- `GET /cloud/termometro`               → pulso del catálogo
- `GET /cloud/top-marcas?limit=N`        → ranking de marcas
- `GET /cloud/ofertas-del-dia?limit=N`   → top descuentos
- `GET /cloud/carrefour-vs-lider?limit=N` → comparativo marca propia vs líder
- `GET /cloud/lo-que-mas-bajo-semana?limit=N` → price drops 7d
- `GET /cloud/marcas-que-mas-aumentan?limit=N` → inflación semanal por marca

## Cómo correr local

```bash
cd frontend-carrefour
npm install
# (opcional) export VITE_API_TARGET=http://147.182.219.80:8002
npm run dev          # http://localhost:5174/carrefour/
npm run build        # genera dist/
```

El `vite.config.ts` proxiea `/cloud`, `/system`, `/products`, `/catalog`
hacia `VITE_API_TARGET` (default `http://127.0.0.1:8002`). Para conectarte
a la API del VPS desde tu local, levantá un SSH tunnel:

```bash
ssh -L 8002:localhost:8002 root@147.182.219.80
```

## Cómo se monta en producción

Mirror de la convención del Costco/Financial:

```
nginx leonardovila.com:443
└── /carrefour/   → static files servidos desde dist/
└── /cloud/       → reverse proxy a 127.0.0.1:8002 (la API)
```

`base: '/carrefour/'` en `vite.config.ts` ya está configurado.

## Decisiones de diseño

- **Verde radioactivo (#39ff14)** como acento principal. Diferenciador vs el
  púrpura de la landing y el navy del financial.
- **Rojo Carrefour (#ee2122)** sólo aparece en marca propia y duelos —
  uso quirúrgico, no decorativo.
- **VT323** para los displays de instrumental (números grandes), **JetBrains
  Mono** para metadata, **Space Grotesk** para titulares. Las 3 fonts del
  ecosistema del operador.
- **Sin chart libraries**: los voltímetros, las barras, el ticker, todo SVG
  o CSS puro. Mantiene el bundle chico y la estética coherente.
- **Narrativa en castellano consumidor**: `precio_venta` no `selling_price`,
  `te_ahorras_ars` no `discount_amount`. Para que pueda leerlo el papá del
  operador y un VP de marketing también.
