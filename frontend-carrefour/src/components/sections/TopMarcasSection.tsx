import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { CloudResponse, TopMarcaRow } from "../../types";
import { compactNumber, floatStr, intStr, money, pct } from "../../lib/format";
import BlueprintBadge from "../lab/BlueprintBadge";
import Centrifuge from "../lab/Centrifuge";
import ScopeGrid from "../lab/ScopeGrid";
import BarPill from "../lab/BarPill";

export default function TopMarcasSection() {
  const { refreshSeed } = useDashboardStore();
  const { data, loading, error } = useApi<CloudResponse<TopMarcaRow>>(`/cloud/top-marcas?limit=15&_=${refreshSeed}`);
  const rows = data?.rows ?? [];

  const max = rows.reduce((m, r) => Math.max(m, intStr(r.productos)), 0);

  return (
    <section id="marcas" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment="EXPERIMENTO N°03"
          title="Centrífuga de marcas"
          subtitle={
            <>
              Las <strong>15 marcas</strong> con más SKUs en góndola hoy. Mirar dónde están las marcas propias de Carrefour
              dentro del ranking dice mucho del posicionamiento del super.
            </>
          }
          status="RANKING VIVO"
          statusColor="#06b6d4"
        />

        {error && <div className="lab-panel p-6 font-mono text-sm neon-blood">⚠ Error: {error}</div>}
        {loading && rows.length === 0 && <Centrifuge label="Centrifugando marcas" />}

        {rows.length > 0 && (
          <div className="lab-panel hud-frame overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-base font-mono">
                <thead>
                  <tr className="text-[var(--color-mute)] text-[12px] font-bold uppercase tracking-[0.18em]">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Marca</th>
                    <th className="px-4 py-3 text-right">Productos</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Distribución</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">Cats</th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">$ promedio</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">En oferta</th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">Desc. avg</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isCarrefour = /carrefour/i.test(r.marca);
                    return (
                      <tr
                        key={r.marca}
                        className={`border-t border-[var(--color-grid)] hover:bg-[var(--color-bench)] transition animate-fade-up ${
                          isCarrefour ? "bg-[rgba(238,33,34,0.04)]" : ""
                        }`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <td className="px-4 py-3 text-[var(--color-faint)] tabular w-8">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={isCarrefour ? "neon-blood font-bold" : "text-[var(--color-paper)] font-medium"}>
                              {r.marca}
                            </span>
                            {isCarrefour && (
                              <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-[var(--color-carrefour)] text-[var(--color-carrefour)]">
                                marca propia
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular neon-green font-bold">
                          {compactNumber(r.productos)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <BarPill
                            value={intStr(r.productos) / Math.max(max, 1)}
                            color={isCarrefour ? "#ee2122" : "#84cc16"}
                          />
                        </td>
                        <td className="px-4 py-3 text-right tabular text-[var(--color-mute)] hidden lg:table-cell">
                          {r.categorias}
                        </td>
                        <td className="px-4 py-3 text-right tabular text-[var(--color-mute)] hidden lg:table-cell">
                          {money(r.precio_promedio_ars)}
                        </td>
                        <td className="px-4 py-3 text-right tabular text-[var(--color-arc)] hidden md:table-cell">
                          {compactNumber(r.en_oferta) || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular hidden md:table-cell">
                          {floatStr(r.descuento_promedio_pct) > 0 ? (
                            <span className="neon-plasma">{pct(r.descuento_promedio_pct)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-6 font-mono text-[12px] text-[var(--color-mute)]">
            // resaltado en rojo: la marca propia del super · view: {data!.view}
          </div>
        )}
      </div>
    </section>
  );
}
