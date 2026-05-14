import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { CarrefourVsLiderRow, CloudResponse } from "../../types";
import { floatStr, money, pct, productUrl } from "../../lib/format";
import BlueprintBadge from "../lab/BlueprintBadge";
import Centrifuge from "../lab/Centrifuge";
import ScopeGrid from "../lab/ScopeGrid";
import HCarousel from "../lab/HCarousel";

/**
 * El experimento estrella. Marca propia vs líder, lado a lado.
 * Cada fila es un duelo visual para que sea compartible.
 */
export default function CarrefourVsLiderSection() {
  const { refreshSeed } = useDashboardStore();
  const { data, loading, error } = useApi<CloudResponse<CarrefourVsLiderRow>>(
    `/cloud/carrefour-vs-lider?limit=12&_=${refreshSeed}`
  );
  const rows = data?.rows ?? [];

  return (
    <section id="vs-lider" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment="EXPERIMENTO N°04 · ESTRELLA"
          title={
            <>
              <span className="neon-blood">Marca Carrefour</span> vs <span className="neon-cyan">marca líder</span>
            </>
          }
          subtitle={
            <>
              Por cada categoría, tomamos el producto Carrefour más barato disponible y lo comparamos contra el
              producto más barato de la competencia. <strong>Cuánto te ahorrás yendo por la marca propia.</strong>
            </>
          }
          status="DUELO POR CATEGORÍA"
          statusColor="#ee2122"
        />

        {error && <div className="lab-panel p-6 font-mono text-sm neon-blood">⚠ Error: {error}</div>}
        {loading && rows.length === 0 && <Centrifuge label="Comparando muestras" />}

        {rows.length > 0 && (() => {
          const renderRow = (r: typeof rows[number], i: number) => {
              const ahorroPct = floatStr(r.te_ahorras_pct);
              return (
                <div
                  key={`${r.categoria}-${i}`}
                  className="lab-panel grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 overflow-hidden animate-fade-up h-full"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* IZQ: Carrefour */}
                  <a
                    href={productUrl(r.url_carrefour)}
                    target="_blank"
                    rel="noopener"
                    className="p-5 flex gap-4 hover:bg-[var(--color-bench)] transition group"
                    style={{ borderLeft: "3px solid var(--color-carrefour)" }}
                  >
                    {r.imagen_carrefour ? (
                      <img
                        src={r.imagen_carrefour}
                        alt=""
                        loading="lazy"
                        className="w-20 h-20 bg-white p-1 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[var(--color-bench)] grid place-items-center shrink-0 font-mono text-[9px] text-[var(--color-faint)]">
                        sin foto
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] neon-blood">
                        marca carrefour
                      </div>
                      <div className="font-display text-sm font-medium leading-snug mt-1 line-clamp-2">
                        {r.producto_carrefour}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--color-mute)] mt-1">{r.categoria}</div>
                      <div className="font-instrument text-3xl tabular leading-none neon-blood mt-auto">
                        {money(r.precio_carrefour)}
                      </div>
                    </div>
                  </a>

                  {/* CENTRO: Diferencia (oro radiante) */}
                  <div
                    className="flex flex-col items-center justify-center px-6 py-4 md:py-6 relative"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(253,230,138,0.7), rgba(255,255,255,0.4) 70%)",
                      borderTop: "1px solid rgba(255,255,255,0.95)",
                      borderBottom: "1px solid rgba(255,255,255,0.95)",
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-mute)]">
                      Te ahorrás
                    </div>
                    <div className="font-instrument text-5xl md:text-6xl tabular leading-none neon-plasma my-2 text-shadow-soft">
                      {pct(ahorroPct)}
                    </div>
                    <div className="font-mono text-xs tabular text-[var(--color-paper)] font-bold">
                      {money(r.te_ahorras_ars)}
                    </div>
                    <div
                      className="mt-3 w-full max-w-[120px] h-2 rounded-full overflow-hidden relative"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.95)",
                        boxShadow: "inset 0 1px 2px rgba(15,23,42,0.06)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700 relative"
                        style={{
                          width: `${Math.min(100, ahorroPct)}%`,
                          background: "linear-gradient(90deg, #84cc16, #fbbf24, #f59e0b)",
                          boxShadow: "0 0 10px rgba(245,158,11,0.6), inset 0 1px 0 rgba(255,255,255,0.6)",
                        }}
                      >
                        <span className="absolute inset-0 animate-shimmer rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* DER: Competencia */}
                  <a
                    href={productUrl(r.url_competencia)}
                    target="_blank"
                    rel="noopener"
                    className="p-5 flex gap-4 hover:bg-[var(--color-bench)] transition group"
                    style={{ borderRight: "3px solid var(--color-arc)" }}
                  >
                    {r.imagen_competencia ? (
                      <img
                        src={r.imagen_competencia}
                        alt=""
                        loading="lazy"
                        className="w-20 h-20 bg-white p-1 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[var(--color-bench)] grid place-items-center shrink-0 font-mono text-[9px] text-[var(--color-faint)]">
                        sin foto
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] neon-cyan">
                        {r.marca_competencia}
                      </div>
                      <div className="font-display text-sm font-medium leading-snug mt-1 line-clamp-2">
                        {r.producto_competencia}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--color-mute)] mt-1">marca líder</div>
                      <div className="font-instrument text-3xl tabular leading-none neon-cyan mt-auto">
                        {money(r.precio_competencia)}
                      </div>
                    </div>
                  </a>
                </div>
              );
          };
          return (
            <>
              {/* Mobile: carousel horizontal — un duelo a la vez */}
              <div className="md:hidden">
                <HCarousel itemWidth="92%">
                  {rows.map((r, i) => renderRow(r, i))}
                </HCarousel>
              </div>
              {/* Desktop: stack vertical clásico */}
              <div className="hidden md:block space-y-4">
                {rows.map((r, i) => renderRow(r, i))}
              </div>
            </>
          );
        })()}

        {rows.length > 0 && (
          <div className="mt-6 font-mono text-[10px] text-[var(--color-faint)]">
            // 1 fila por categoría hoja · ordenado por % de ahorro desc · view: {data!.view}
          </div>
        )}
      </div>
    </section>
  );
}
