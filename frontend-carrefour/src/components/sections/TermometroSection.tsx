import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { CloudResponse, TermometroRow } from "../../types";
import { compactNumber, intStr, money } from "../../lib/format";
import BlueprintBadge from "../lab/BlueprintBadge";
import Voltimeter from "../lab/Voltimeter";
import ScopeGrid from "../lab/ScopeGrid";
import Centrifuge from "../lab/Centrifuge";
import { useI18n } from "../../i18n";

export default function TermometroSection() {
  const { refreshSeed } = useDashboardStore();
  const { data, loading, error } = useApi<CloudResponse<TermometroRow>>(`/cloud/termometro?_=${refreshSeed}`);
  const r = data?.rows[0];
  const { t } = useI18n();

  const productos = intStr(r?.productos_disponibles);
  const ofertas = intStr(r?.productos_en_oferta);
  const marcas = intStr(r?.marcas_activas);
  const ahorro = intStr(r?.ahorro_total_disponible_ars);
  const promedio = intStr(r?.precio_promedio_ars);
  const mediano = intStr(r?.precio_mediano_ars);

  return (
    <section id="termometro" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment={t("term.experiment")}
          title={t("term.title")}
          subtitle={
            <>
              {t("term.subtitle").split("{strong}")[0]}
              <strong className="text-[var(--color-paper)]">{t("term.subtitleStrong")}</strong>
              {t("term.subtitle").split("{strong}")[1]}
            </>
          }
          status={t("term.status")}
        />

        {error && (
          <div className="lab-panel p-6 font-mono text-sm neon-blood">⚠ Error: {error}</div>
        )}
        {loading && !r && <Centrifuge label={t("term.loading")} />}

        {r && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Voltimeter value={productos} max={25000} label={t("term.productsAvailable")} unit="u" color="#84cc16" />
            <Voltimeter value={marcas} max={2500} label={t("term.activeBrands")} unit="" color="#06b6d4" />
            <Voltimeter value={ofertas} max={5000} label={t("term.productsOnSale")} unit="u" color="#f59e0b" />
          </div>
        )}

        {r && (
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <div className="lab-panel p-6 hud-frame animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--color-mute)]">
                {t("term.discountTitle")}
              </div>
              <div className="font-instrument neon-plasma text-5xl tabular mt-3 leading-none">
                {money(ahorro)}
              </div>
              <div className="font-mono text-[13px] text-[var(--color-mute)] mt-3 leading-relaxed">
                {t("term.discountDesc")}
              </div>
            </div>

            <div className="lab-panel p-6 hud-frame animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--color-mute)]">
                {t("term.avgPriceTitle")}
              </div>
              <div className="font-instrument neon-green text-5xl tabular mt-3 leading-none">{money(promedio)}</div>
              <div className="font-mono text-[13px] text-[var(--color-mute)] mt-3 leading-relaxed">
                {t("term.avgPriceDesc")}
              </div>
            </div>

            <div className="lab-panel p-6 hud-frame animate-fade-up" style={{ animationDelay: "180ms" }}>
              <div className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--color-mute)]">
                {t("term.medianTitle")}
              </div>
              <div className="font-instrument neon-cyan text-5xl tabular mt-3 leading-none">{money(mediano)}</div>
              <div className="font-mono text-[13px] text-[var(--color-mute)] mt-3 leading-relaxed">
                {t("term.medianDesc")}
              </div>
            </div>
          </div>
        )}

        {r && (
          <div className="mt-8 font-mono text-[12px] text-[var(--color-mute)] flex items-center gap-3 flex-wrap">
            <span>// {t("term.sample")}: {r.fecha}</span>
            <span className="text-[var(--color-radio)]">●</span>
            <span>view: {data!.view}</span>
            <span className="text-[var(--color-arc)]">●</span>
            <span>{t("term.source")}: {data!.source}</span>
            <span className="text-[var(--color-plasma)]">●</span>
            <span>{t("term.uniqueSkus")}: {compactNumber(productos)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
