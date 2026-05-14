import BlueprintBadge from "../lab/BlueprintBadge";
import ScopeGrid from "../lab/ScopeGrid";
import HCarousel from "../lab/HCarousel";

/**
 * Sección "cómo se hace": el pipeline narrado para no-técnicos pero que
 * un ingeniero también lea con respeto. Es la pieza de "venta" del operador.
 */
export default function Pipeline() {
  const steps = [
    {
      n: "01",
      tag: "DISCOVERY",
      color: "#84cc16",
      title: "Mapeo topológico",
      desc: "Pegamos al endpoint público del árbol de categorías de Carrefour y extraemos las 444 hojas (nivel más profundo). Filtramos basura como 'Test Category' y categorías marcadas '(no se usa)'.",
      tech: "GET /api/catalog_system/pub/category/tree/3",
    },
    {
      n: "02",
      tag: "EXTRACCIÓN",
      color: "#06b6d4",
      title: "Scraping con TLS impersonation",
      desc: "Cloudflare bloquea requests Python crudos. Usamos curl_cffi con impersonation chrome110 para parecer un browser real. 5 categorías en paralelo, paginación de 50 productos por request, backoff exponencial ante 403/429/5xx.",
      tech: "curl_cffi + asyncio.Semaphore(5)",
    },
    {
      n: "03",
      tag: "BRONZE",
      color: "#f59e0b",
      title: "Escritura streaming a Parquet",
      desc: "Cada categoría se escribe a su propio archivo Parquet (compresión zstd) y se sube a S3 inmediatamente. Streaming write para que el VPS de 1GB de RAM no muera. Hive partitioning por fecha de ingest.",
      tech: "PyArrow + boto3 + Hive partitioning",
    },
    {
      n: "04",
      tag: "CATALOG",
      color: "#fbbf24",
      title: "Glue indexa el lake",
      desc: "Un crawler de AWS Glue descubre el schema de los Parquet y lo registra en el catálogo. Eso permite que cualquier engine SQL consulte el bronze sin saber dónde están los archivos.",
      tech: "AWS Glue Crawler + Data Catalog",
    },
    {
      n: "05",
      tag: "SILVER · GOLD",
      color: "#84cc16",
      title: "Modelo en estrella sobre Athena",
      desc: "11 vistas SQL: capa silver con tipos limpios y nombres en castellano, dimensiones (marca, categoría, fecha), tabla fact por día, y 6 marts narrativos como los que ves arriba.",
      tech: "Athena workgroup + CREATE OR REPLACE VIEW",
    },
    {
      n: "06",
      tag: "SERVING",
      color: "#06b6d4",
      title: "API + dashboard",
      desc: "FastAPI en el VPS expone los marts via /cloud/*. Este dashboard los consume con React + Vite. Cero estado intermedio: cada query corre fresca contra Athena.",
      tech: "FastAPI + React 19 + Vite",
    },
  ];

  return (
    <section id="pipeline" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment="DOCUMENTACIÓN TÉCNICA"
          title="Cómo se construye este laboratorio"
          subtitle={
            <>
              Pipeline end-to-end. El catálogo entero de Carrefour Argentina viajando desde un endpoint detrás de Cloudflare
              hasta este dashboard, todas las noches, sin intervención humana.
            </>
          }
          status="OPEN PROCESS"
          statusColor="#06b6d4"
        />

        {(() => {
          const renderStep = (s: typeof steps[number], i: number) => (
            <div
              key={s.n}
              className="lab-panel p-6 hud-frame relative animate-fade-up overflow-hidden h-full"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Halo de color del step en la esquina */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${s.color}55, transparent 70%)`,
                  filter: "blur(16px)",
                }}
              />
              <div
                className="font-instrument text-7xl tabular leading-none relative"
                style={{ color: s.color, textShadow: `0 1px 0 #fff, 0 0 20px ${s.color}aa`, opacity: 0.85 }}
              >
                {s.n}
              </div>
              <div
                className="font-mono text-[12px] uppercase tracking-[0.22em] mt-1 font-bold"
                style={{ color: s.color }}
              >
                {s.tag}
              </div>
              <div className="font-display text-xl font-bold mt-1.5 leading-tight">{s.title}</div>
              <div className="font-mono text-[13px] text-[var(--color-mute)] mt-3 leading-relaxed">{s.desc}</div>
              <div className="mt-4 pt-3 border-t border-white/80 font-mono text-[11px] text-[var(--color-mute)] font-semibold">
                {s.tech}
              </div>
            </div>
          );
          return (
            <>
              {/* Mobile: carousel horizontal con dots */}
              <div className="md:hidden">
                <HCarousel itemWidth="86%">
                  {steps.map((s, i) => renderStep(s, i))}
                </HCarousel>
              </div>
              {/* Desktop: grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {steps.map((s, i) => renderStep(s, i))}
              </div>
            </>
          );
        })()}
      </div>
    </section>
  );
}
