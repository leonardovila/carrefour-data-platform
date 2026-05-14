import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "es";

const dict = {
  // ---- Hero ----
  "hero.liveData": { en: "LIVE DATA", es: "DATOS EN VIVO" },
  "hero.labOf": { en: "Retail Lab", es: "Laboratorio de" },
  "hero.word1": { en: "Shelf", es: "Góndola" },
  "hero.commercialIntel": { en: "Commercial intelligence across", es: "Inteligencia comercial sobre" },
  "hero.products": { en: "products", es: "productos" },
  "hero.activeBrands": { en: "active brands", es: "marcas activas" },
  "hero.categoriesToday": { en: "categories today.", es: "categorías de hoy." },
  "hero.howBuilt": { en: "How is it built? →", es: "¿Cómo se construye? →" },
  "hero.backToOperator": { en: "← Back to operator’s site", es: "← Volver al sitio del operador" },
  "hero.skus": { en: "SKUs", es: "SKUs" },
  "hero.brands": { en: "Brands", es: "Marcas" },
  "hero.deals": { en: "Deals", es: "Ofertas" },

  // Hero top ticker
  "hero.ticker.liveSample": {
    en: "✦ LIVE SAMPLE · CARREFOUR ARGENTINA CATALOG",
    es: "✦ MUESTRA EN VIVO · CATÁLOGO CARREFOUR ARGENTINA",
  },
  "hero.ticker.productsDetected": { en: "PRODUCTS DETECTED TODAY", es: "PRODUCTOS DETECTADOS HOY" },
  "hero.ticker.onSale": { en: "ON SALE", es: "EN OFERTA" },
  "hero.ticker.savings": {
    en: "✦ AVAILABLE ACCUMULATED SAVINGS:",
    es: "✦ AHORRO ACUMULADO DISPONIBLE:",
  },
  "hero.ticker.tools": {
    en: "✦ TOOLS: PYTHON + DUCKDB + ATHENA · INGESTION: TLS IMPERSONATION + EXPONENTIAL BACKOFF",
    es: "✦ INSTRUMENTAL: PYTHON + DUCKDB + ATHENA · INGESTA: TLS IMPERSONATION + BACKOFF EXPONENCIAL",
  },

  // Hero bottom ticker
  "hero.tickerB.vps": { en: "VPS DigitalOcean (NYC)", es: "VPS DigitalOcean (NYC)" },
  "hero.tickerB.bronze": { en: "Bronze layer on S3 us-east-2", es: "Bronze layer en S3 us-east-2" },
  "hero.tickerB.catalog": { en: "Carrefour AR Catalog", es: "Catálogo Carrefour AR" },
  "hero.tickerB.athena": { en: "Athena workgroup carrefour-wg", es: "Athena workgroup carrefour-wg" },
  "hero.tickerB.cron": { en: "Daily cron @ 03:30 ART", es: "Cron diario @ 03:30 ART" },
  "hero.tickerB.views": { en: "11 SQL views applied", es: "11 vistas SQL aplicadas" },
  "hero.tickerB.leafCats": { en: "444 leaf categories discovered", es: "444 categorías hoja descubiertas" },

  // ---- Nav ----
  "nav.thermometer": { en: "Thermometer", es: "Termómetro" },
  "nav.dealsOfDay": { en: "Daily deals", es: "Ofertas del día" },
  "nav.vsLeader": { en: "Carrefour vs Leader", es: "Carrefour vs Líder" },
  "nav.topBrands": { en: "Top brands", es: "Top marcas" },
  "nav.priceDrops": { en: "Price drops", es: "Lo que bajó" },
  "nav.pipelineDoc": { en: "Pipeline · doc", es: "Pipeline · doc" },
  "nav.labNavigation": { en: "Lab navigation", es: "Navegación del laboratorio" },
  "nav.experiments": { en: "experiments · scroll-spy ON", es: "experimentos · scroll-spy ON" },
  "nav.jumpToSection": { en: "Jump to section", es: "Saltar a sección" },
  "nav.currentSection": { en: "Current section", es: "Sección actual" },

  // ---- Termometro ----
  "term.experiment": { en: "EXPERIMENT #01", es: "EXPERIMENTO N°01" },
  "term.title": { en: "Shelf thermometer", es: "Termómetro de la góndola" },
  "term.subtitle": {
    en: "Every night when the supermarket closes, this lab takes {strong} of Carrefour Argentina’s catalog. These are today’s vital signs.",
    es: "Cada noche al cerrar el supermercado, este laboratorio toma {strong} del catálogo de Carrefour Argentina. Estos son los signos vitales de hoy.",
  },
  "term.subtitleStrong": { en: "a complete snapshot", es: "una foto completa" },
  "term.status": { en: "FRESH SAMPLE", es: "MUESTRA FRESCA" },
  "term.loading": { en: "Taking thermometer sample", es: "Tomando muestra del termómetro" },
  "term.productsAvailable": { en: "Available products", es: "Productos disponibles" },
  "term.activeBrands": { en: "Active brands today", es: "Marcas activas hoy" },
  "term.productsOnSale": { en: "Products on sale", es: "Productos en oferta" },
  "term.discountTitle": {
    en: "Money accumulated in currently available discounts",
    es: "Dinero acumulado en descuentos disponibles ahora mismo",
  },
  "term.discountDesc": {
    en: "Add up what you’d save if you bought every product on sale today. Changes daily.",
    es: "Sumá lo que te ahorrás si comprás todos los productos que hoy están con descuento. Cambia día a día.",
  },
  "term.avgPriceTitle": { en: "Average shelf price", es: "Precio promedio de góndola" },
  "term.avgPriceDesc": {
    en: "What each product in today’s catalog costs on average, including high-end appliances.",
    es: "Lo que sale, en promedio, cada producto del catálogo de hoy, incluyendo electrodomésticos altos.",
  },
  "term.medianTitle": { en: "Median price · “the middle one”", es: "Precio mediano · “el del medio”" },
  "term.medianDesc": {
    en: "Half of the products cost less than this, the other half more. Best real-wallet thermometer.",
    es: "La mitad de los productos cuesta menos que esto, la otra mitad más. Mejor termómetro real del bolsillo.",
  },
  "term.sample": { en: "sample", es: "muestra" },
  "term.source": { en: "source", es: "fuente" },
  "term.uniqueSkus": { en: "Unique SKUs detected", es: "SKUs únicos detectados" },

  // ---- Ofertas ----
  "of.experiment": { en: "EXPERIMENT #02", es: "EXPERIMENTO N°02" },
  "of.title": { en: "Today’s best deals", es: "Las mejores ofertas del día" },
  "of.subtitle": {
    en: "We filter products with real discounts {strong} vs list price. No shady promos — cold hard savings.",
    es: "Filtramos los productos con descuento real {strong} respecto al precio de lista. No promos turbias — ahorro contante y sonante.",
  },
  "of.status": { en: "DISCOUNT ≥ 15%", es: "DESCUENTO ≥ 15%" },
  "of.loading": { en: "Detecting deals", es: "Detectando ofertas" },
  "of.noImage": { en: "no image", es: "sin imagen" },
  "of.youSave": { en: "you save", es: "te ahorrás" },
  "of.installments": { en: "or {n} installments of {v}", es: "o {n} cuotas de {v}" },
  "of.noDeals": { en: "No significant deals detected today.", es: "No detectamos ofertas significativas hoy." },
  "of.showing": {
    en: "showing {n} samples · sorted by % discount desc · view: {v}",
    es: "mostrando {n} muestras · ordenadas por % descuento desc · view: {v}",
  },

  // ---- Top Marcas ----
  "tm.experiment": { en: "EXPERIMENT #03", es: "EXPERIMENTO N°03" },
  "tm.title": { en: "Brand centrifuge", es: "Centrífuga de marcas" },
  "tm.subtitle": {
    en: "The {strong} with the most SKUs on the shelf today. Where Carrefour’s private label sits in the ranking says a lot about the supermarket’s positioning.",
    es: "Las {strong} con más SKUs en góndola hoy. Mirar dónde están las marcas propias de Carrefour dentro del ranking dice mucho del posicionamiento del super.",
  },
  "tm.subtitleStrong": { en: "15 brands", es: "15 marcas" },
  "tm.status": { en: "LIVE RANKING", es: "RANKING VIVO" },
  "tm.loading": { en: "Centrifuging brands", es: "Centrifugando marcas" },
  "tm.rank": { en: "#", es: "#" },
  "tm.brand": { en: "Brand", es: "Marca" },
  "tm.products": { en: "Products", es: "Productos" },
  "tm.distribution": { en: "Distribution", es: "Distribución" },
  "tm.cats": { en: "Cats", es: "Cats" },
  "tm.avgPrice": { en: "Avg price", es: "$ promedio" },
  "tm.onSale": { en: "On sale", es: "En oferta" },
  "tm.avgDiscount": { en: "Avg disc.", es: "Desc. avg" },
  "tm.privateLabel": { en: "private label", es: "marca propia" },
  "tm.footer": {
    en: "highlighted in red: supermarket’s private label · view: {v}",
    es: "resaltado en rojo: la marca propia del super · view: {v}",
  },

  // ---- Carrefour vs Lider ----
  "vs.experiment": { en: "EXPERIMENT #04 · STAR", es: "EXPERIMENTO N°04 · ESTRELLA" },
  "vs.subtitle": {
    en: "For each category, we take the cheapest available Carrefour product and compare it against the cheapest from the competition. {strong}",
    es: "Por cada categoría, tomamos el producto Carrefour más barato disponible y lo comparamos contra el producto más barato de la competencia. {strong}",
  },
  "vs.subtitleStrong": {
    en: "How much you save by going private label.",
    es: "Cuánto te ahorrás yendo por la marca propia.",
  },
  "vs.status": { en: "DUEL BY CATEGORY", es: "DUELO POR CATEGORÍA" },
  "vs.loading": { en: "Comparing samples", es: "Comparando muestras" },
  "vs.carrefourBrand": { en: "carrefour brand", es: "marca carrefour" },
  "vs.noPhoto": { en: "no photo", es: "sin foto" },
  "vs.youSave": { en: "You save", es: "Te ahorrás" },
  "vs.leadingBrand": { en: "leading brand", es: "marca líder" },
  "vs.footer": {
    en: "1 row per leaf category · sorted by % savings desc · view: {v}",
    es: "1 fila por categoría hoja · ordenado por % de ahorro desc · view: {v}",
  },

  // ---- Lo que bajo ----
  "lb.experiment": { en: "EXPERIMENT #05", es: "EXPERIMENTO N°05" },
  "lb.title": { en: "Biggest price drops this week", es: "Lo que más bajó esta semana" },
  "lb.subtitle": {
    en: "We compare each product against its price from 7 days ago. {strong} — the daily cron keeps feeding it on its own. In 7 days you’ll see it explode with data.",
    es: "Comparamos cada producto contra su precio de hace 7 días. {strong} — el cron diario lo va alimentando solo. En 7 días vas a verlo explotar de data.",
  },
  "lb.subtitleStrong": {
    en: "The lab is still incubating this experiment",
    es: "El laboratorio recién está incubando este experimento",
  },
  "lb.statusInc": { en: "INCUBATING 7 DAYS", es: "INCUBANDO 7 DÍAS" },
  "lb.statusActive": { en: "ACTIVE", es: "ACTIVO" },
  "lb.loading": { en: "Looking for price drops", es: "Buscando price drops" },
  "lb.incTitle": { en: "Sample incubating", es: "Muestra en incubación" },
  "lb.incDesc1": { en: "To detect prices that dropped, I need at least", es: "Para detectar precios que bajaron, necesito al menos" },
  "lb.incDescStrong": { en: "2 catalog snapshots", es: "2 fotos del catálogo" },
  "lb.incDesc2": {
    en: "separated in time. Today I have the first one. The cron @ 03:30 ART adds one more each night.",
    es: "separadas en el tiempo. Hoy tengo la primera. El cron @ 03:30 ART agrega una más cada noche.",
  },
  "lb.incDesc3": {
    en: "→ In one week this section fills up with real price drops.",
    es: "→ En una semana esta sección se llena de productos en baja real.",
  },
  "lb.incFooter": {
    en: "meanwhile: SQL logic is already applied in Athena. The view exists, just waiting for partitions.",
    es: "mientras tanto: la lógica SQL ya está aplicada en Athena. La view existe, solo espera particiones.",
  },
  "lb.colProduct": { en: "Product", es: "Producto" },
  "lb.col7Days": { en: "7 days ago", es: "Hace 7 días" },
  "lb.colToday": { en: "Today", es: "Hoy" },
  "lb.colDropped": { en: "Dropped", es: "Bajó" },

  // ---- Pipeline ----
  "pl.experiment": { en: "TECHNICAL DOCUMENTATION", es: "DOCUMENTACIÓN TÉCNICA" },
  "pl.title": { en: "How this lab is built", es: "Cómo se construye este laboratorio" },
  "pl.subtitle": {
    en: "End-to-end pipeline. The entire Carrefour Argentina catalog traveling from an endpoint behind Cloudflare to this dashboard, every night, without human intervention.",
    es: "Pipeline end-to-end. El catálogo entero de Carrefour Argentina viajando desde un endpoint detrás de Cloudflare hasta este dashboard, todas las noches, sin intervención humana.",
  },
  "pl.status": { en: "OPEN PROCESS", es: "OPEN PROCESS" },

  "pl.s1.tag": { en: "DISCOVERY", es: "DISCOVERY" },
  "pl.s1.title": { en: "Topological mapping", es: "Mapeo topológico" },
  "pl.s1.desc": {
    en: "We hit Carrefour’s public category tree endpoint and extract 444 leaves (deepest level). We filter junk like ‘Test Category’ and categories marked ‘(not in use)’.",
    es: "Pegamos al endpoint público del árbol de categorías de Carrefour y extraemos las 444 hojas (nivel más profundo). Filtramos basura como ‘Test Category’ y categorías marcadas ‘(no se usa)’.",
  },
  "pl.s1.tech": { en: "GET /api/catalog_system/pub/category/tree/3", es: "GET /api/catalog_system/pub/category/tree/3" },

  "pl.s2.tag": { en: "EXTRACTION", es: "EXTRACCIÓN" },
  "pl.s2.title": { en: "Scraping with TLS impersonation", es: "Scraping con TLS impersonation" },
  "pl.s2.desc": {
    en: "Cloudflare blocks raw Python requests. We use curl_cffi with chrome110 impersonation to look like a real browser. 5 categories in parallel, 50 products per request, exponential backoff on 403/429/5xx.",
    es: "Cloudflare bloquea requests Python crudos. Usamos curl_cffi con impersonation chrome110 para parecer un browser real. 5 categorías en paralelo, paginación de 50 productos por request, backoff exponencial ante 403/429/5xx.",
  },
  "pl.s2.tech": { en: "curl_cffi + asyncio.Semaphore(5)", es: "curl_cffi + asyncio.Semaphore(5)" },

  "pl.s3.tag": { en: "BRONZE", es: "BRONZE" },
  "pl.s3.title": { en: "Streaming Parquet write", es: "Escritura streaming a Parquet" },
  "pl.s3.desc": {
    en: "Each category writes to its own Parquet file (zstd compression) and uploads to S3 immediately. Streaming write so the 1GB RAM VPS doesn’t die. Hive partitioning by ingest date.",
    es: "Cada categoría se escribe a su propio archivo Parquet (compresión zstd) y se sube a S3 inmediatamente. Streaming write para que el VPS de 1GB de RAM no muera. Hive partitioning por fecha de ingest.",
  },
  "pl.s3.tech": { en: "PyArrow + boto3 + Hive partitioning", es: "PyArrow + boto3 + Hive partitioning" },

  "pl.s4.tag": { en: "CATALOG", es: "CATALOG" },
  "pl.s4.title": { en: "Glue indexes the lake", es: "Glue indexa el lake" },
  "pl.s4.desc": {
    en: "An AWS Glue crawler discovers the Parquet schema and registers it in the catalog. This allows any SQL engine to query the bronze without knowing where the files are.",
    es: "Un crawler de AWS Glue descubre el schema de los Parquet y lo registra en el catálogo. Eso permite que cualquier engine SQL consulte el bronze sin saber dónde están los archivos.",
  },
  "pl.s4.tech": { en: "AWS Glue Crawler + Data Catalog", es: "AWS Glue Crawler + Data Catalog" },

  "pl.s5.tag": { en: "SILVER · GOLD", es: "SILVER · GOLD" },
  "pl.s5.title": { en: "Star schema on Athena", es: "Modelo en estrella sobre Athena" },
  "pl.s5.desc": {
    en: "11 SQL views: silver layer with clean types and Spanish column names, dimensions (brand, category, date), daily fact table, and 6 narrative marts like the ones you see above.",
    es: "11 vistas SQL: capa silver con tipos limpios y nombres en castellano, dimensiones (marca, categoría, fecha), tabla fact por día, y 6 marts narrativos como los que ves arriba.",
  },
  "pl.s5.tech": { en: "Athena workgroup + CREATE OR REPLACE VIEW", es: "Athena workgroup + CREATE OR REPLACE VIEW" },

  "pl.s6.tag": { en: "SERVING", es: "SERVING" },
  "pl.s6.title": { en: "API + dashboard", es: "API + dashboard" },
  "pl.s6.desc": {
    en: "FastAPI on the VPS exposes the marts via /cloud/*. This dashboard consumes them with React + Vite. Zero intermediate state: each query runs fresh against Athena.",
    es: "FastAPI en el VPS expone los marts via /cloud/*. Este dashboard los consume con React + Vite. Cero estado intermedio: cada query corre fresca contra Athena.",
  },
  "pl.s6.tech": { en: "FastAPI + React 19 + Vite", es: "FastAPI + React 19 + Vite" },

  // ---- Footer ----
  "ft.labOperator": { en: "Lab operator", es: "Operador del laboratorio" },
  "ft.sampleFreq": { en: "Sample frequency", es: "Frecuencia de muestra" },
  "ft.daily": { en: "03:30 ART · daily", es: "03:30 ART · diario" },
  "ft.pipelineDesc": {
    en: "The pipeline runs every night, after the Costco scraper to avoid overlap. When you come back tomorrow, there’s a new partition and the temporal marts update themselves.",
    es: "El pipeline corre cada noche, después del scraper de Costco para no pisarnos. Cuando vuelvas mañana, hay una partición nueva y los marts temporales se actualizan solos.",
  },
  "ft.disclaimer": { en: "Disclaimer", es: "Disclaimer" },
  "ft.disclaimerText": {
    en: "Personal commercial intelligence lab on public data from Carrefour Argentina’s online catalog. Not affiliated with the company. Prices may vary between the nightly capture and the moment you go to the store.",
    es: "Laboratorio personal de inteligencia comercial sobre datos públicos del catálogo online de Carrefour Argentina. Sin afiliación con la empresa. Los precios pueden variar entre la captura nocturna y el momento en que vas al super.",
  },

  // ---- Error boundary ----
  "err.tape": { en: "⚠ INSTRUMENT FAILURE", es: "⚠ FALLO DEL INSTRUMENTO" },
  "err.title": { en: "The lab crashed", es: "El laboratorio crasheó" },
  "err.restart": { en: "// Restart sample", es: "// Reiniciar muestra" },

  // ---- Misc / shared ----
  "misc.sample": { en: "sample", es: "muestra" },
} as const;

export type TKey = keyof typeof dict;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

function initial(): Lang {
  try {
    if (localStorage.getItem("lang") === "es") return "es";
  } catch {}
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setRaw] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setRaw(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((k: TKey) => dict[k]?.[lang] ?? k, [lang]);

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n requires I18nProvider");
  return c;
}
