import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { BajoSemanaRow, CloudResponse } from "../../types";
import { floatStr, money, pct, productUrl } from "../../lib/format";
import BlueprintBadge from "../lab/BlueprintBadge";
import Centrifuge from "../lab/Centrifuge";
import ScopeGrid from "../lab/ScopeGrid";
import { useI18n } from "../../i18n";

export default function LoQueBajoSection() {
  const { refreshSeed } = useDashboardStore();
  const { data, loading, error } = useApi<CloudResponse<BajoSemanaRow>>(
    `/cloud/lo-que-mas-bajo-semana?limit=10&_=${refreshSeed}`
  );
  const rows = data?.rows ?? [];
  const { t } = useI18n();

  return (
    <section id="bajo-semana" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment={t("lb.experiment")}
          title={t("lb.title")}
          subtitle={
            <>
              {t("lb.subtitle").split("{strong}")[0]}
              <strong className="text-[var(--color-paper)]">{t("lb.subtitleStrong")}</strong>
              {t("lb.subtitle").split("{strong}")[1]}
            </>
          }
          status={rows.length === 0 ? t("lb.statusInc") : t("lb.statusActive")}
          statusColor={rows.length === 0 ? "#fbbf24" : "#84cc16"}
        />

        {error && <div className="lab-panel p-6 font-mono text-sm neon-blood">⚠ Error: {error}</div>}
        {loading && rows.length === 0 && <Centrifuge label={t("lb.loading")} />}

        {!loading && rows.length === 0 && (
          <div className="lab-panel p-10 hud-frame">
            <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
              <div className="font-instrument text-7xl neon-warn leading-none">⏳</div>
              <div>
                <div className="font-display text-2xl font-bold mb-2">{t("lb.incTitle")}</div>
                <div className="font-mono text-sm text-[var(--color-mute)] leading-relaxed max-w-2xl">
                  {t("lb.incDesc1")} <strong className="text-[var(--color-paper)]">{t("lb.incDescStrong")}</strong>{" "}
                  {t("lb.incDesc2")} <br />
                  <span className="neon-green">{t("lb.incDesc3")}</span>
                </div>
                <div className="mt-4 font-mono text-[10px] text-[var(--color-faint)]">
                  // {t("lb.incFooter")}
                </div>
              </div>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="lab-panel hud-frame overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-[var(--color-mute)] text-[10px] uppercase tracking-[0.2em]">
                  <th className="px-4 py-3 text-left">{t("lb.colProduct")}</th>
                  <th className="px-4 py-3 text-right">{t("lb.col7Days")}</th>
                  <th className="px-4 py-3 text-right">{t("lb.colToday")}</th>
                  <th className="px-4 py-3 text-right">{t("lb.colDropped")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.producto}-${i}`}
                    className="border-t border-[var(--color-grid)] hover:bg-[var(--color-bench)] transition animate-fade-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <a href={productUrl(r.url)} target="_blank" rel="noopener" className="text-[var(--color-paper)] hover:neon-green transition">
                        {r.producto}
                      </a>
                      <div className="text-[10px] text-[var(--color-mute)] mt-0.5">
                        {r.marca} · {r.categoria}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular text-[var(--color-faint)] line-through">
                      {money(r.precio_hace_una_semana)}
                    </td>
                    <td className="px-4 py-3 text-right tabular neon-green font-bold">{money(r.precio_hoy)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-instrument text-xl neon-plasma tabular">{pct(floatStr(r.bajo_pct))}</span>
                      <div className="text-[10px] text-[var(--color-mute)] mt-0.5">{money(r.bajo_ars)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
