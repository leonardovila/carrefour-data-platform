import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { CloudResponse, OfertaRow } from "../../types";
import { floatStr, money, productUrl } from "../../lib/format";
import BlueprintBadge from "../lab/BlueprintBadge";
import Centrifuge from "../lab/Centrifuge";
import ScopeGrid from "../lab/ScopeGrid";
import HCarousel from "../lab/HCarousel";
import { useI18n } from "../../i18n";

export default function OfertasSection() {
  const { refreshSeed } = useDashboardStore();
  const { data, loading, error } = useApi<CloudResponse<OfertaRow>>(`/cloud/ofertas-del-dia?limit=24&_=${refreshSeed}`);
  const rows = data?.rows ?? [];
  const { t } = useI18n();

  return (
    <section id="ofertas" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment={t("of.experiment")}
          title={t("of.title")}
          subtitle={
            <>
              {t("of.subtitle").split("{strong}")[0]}
              <strong>≥ 15%</strong>
              {t("of.subtitle").split("{strong}")[1]}
            </>
          }
          status={t("of.status")}
          statusColor="#f59e0b"
        />

        {error && <div className="lab-panel p-6 font-mono text-sm neon-blood">⚠ Error: {error}</div>}
        {loading && rows.length === 0 && <Centrifuge label={t("of.loading")} />}

        {rows.length > 0 && (() => {
          const renderCard = (p: OfertaRow, i: number) => {
              const desc = floatStr(p.descuento_pct);
              const ringColor = desc >= 50 ? "#ee2122" : desc >= 30 ? "#f59e0b" : "#84cc16";
              const ringTextColor = desc >= 50 ? "#ffffff" : "#1e293b";

              return (
                <a
                  key={`${p.producto}-${i}`}
                  href={productUrl(p.url)}
                  target="_blank"
                  rel="noopener"
                  className="group relative lab-panel overflow-hidden hover:lab-panel-glow transition-all duration-300 animate-fade-up h-full flex flex-col"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className="absolute top-3 right-3 z-10 px-2.5 py-1 font-mono text-xs font-bold tracking-wider rounded-full border border-white"
                    style={{
                      background: `linear-gradient(180deg, #ffffff 0%, ${ringColor} 120%)`,
                      color: ringTextColor,
                      boxShadow: `0 4px 12px ${ringColor}88, inset 0 1px 0 rgba(255,255,255,0.95)`,
                    }}
                  >
                    -{Math.round(desc)}%
                  </div>

                  <div className="aspect-square w-full bg-white relative overflow-hidden rounded-t-[22px]">
                    {p.imagen ? (
                      <img
                        src={p.imagen}
                        alt={p.producto}
                        loading="lazy"
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-faint)] font-mono text-xs">
                        {t("of.noImage")}
                      </div>
                    )}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 110%, ${ringColor}55, transparent 60%)`,
                      }}
                    />
                  </div>

                  <div className="p-5 flex flex-col gap-2">
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-mute)]">
                      {p.marca || "—"} · {p.categoria || "—"}
                    </div>
                    <div className="font-display text-base font-semibold leading-snug line-clamp-2 min-h-[2.6em]">
                      {p.producto}
                    </div>

                    <div className="mt-auto pt-3 border-t border-[var(--color-grid)]">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono text-sm text-[var(--color-mute)] line-through tabular">
                          {money(p.precio_lista)}
                        </span>
                        <span className="font-instrument text-3xl tabular leading-none neon-green">
                          {money(p.precio_venta)}
                        </span>
                      </div>
                      <div
                        className="font-mono text-[12px] mt-1.5 font-semibold"
                        style={{ color: ringColor }}
                      >
                        {t("of.youSave")} <strong>{money(p.te_ahorras_ars)}</strong>
                      </div>
                      {p.cuotas_max && parseInt(p.cuotas_max) > 1 && (
                        <div className="font-mono text-[12px] text-[var(--color-mute)] mt-1">
                          {t("of.installments").replace("{n}", p.cuotas_max).replace("{v}", money(p.valor_cuota))}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
          };
          return (
            <>
              <div className="md:hidden">
                <HCarousel itemWidth="80%">
                  {rows.map((p, i) => renderCard(p, i))}
                </HCarousel>
              </div>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rows.map((p, i) => renderCard(p, i))}
              </div>
            </>
          );
        })()}

        {data && rows.length === 0 && !loading && (
          <div className="lab-panel p-12 font-mono text-center text-[var(--color-mute)]">
            {t("of.noDeals")} <span className="lab-cursor"></span>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-6 font-mono text-[10px] text-[var(--color-faint)]">
            // {t("of.showing").replace("{n}", String(rows.length)).replace("{v}", data!.view)}
          </div>
        )}
      </div>
    </section>
  );
}
