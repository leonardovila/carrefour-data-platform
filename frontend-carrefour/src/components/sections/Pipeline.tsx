import BlueprintBadge from "../lab/BlueprintBadge";
import ScopeGrid from "../lab/ScopeGrid";
import HCarousel from "../lab/HCarousel";
import { useI18n } from "../../i18n";
import type { TKey } from "../../i18n";

export default function Pipeline() {
  const { t } = useI18n();

  const steps: { n: string; tagKey: TKey; color: string; titleKey: TKey; descKey: TKey; techKey: TKey }[] = [
    { n: "01", tagKey: "pl.s1.tag", color: "#84cc16", titleKey: "pl.s1.title", descKey: "pl.s1.desc", techKey: "pl.s1.tech" },
    { n: "02", tagKey: "pl.s2.tag", color: "#06b6d4", titleKey: "pl.s2.title", descKey: "pl.s2.desc", techKey: "pl.s2.tech" },
    { n: "03", tagKey: "pl.s3.tag", color: "#f59e0b", titleKey: "pl.s3.title", descKey: "pl.s3.desc", techKey: "pl.s3.tech" },
    { n: "04", tagKey: "pl.s4.tag", color: "#fbbf24", titleKey: "pl.s4.title", descKey: "pl.s4.desc", techKey: "pl.s4.tech" },
    { n: "05", tagKey: "pl.s5.tag", color: "#84cc16", titleKey: "pl.s5.title", descKey: "pl.s5.desc", techKey: "pl.s5.tech" },
    { n: "06", tagKey: "pl.s6.tag", color: "#06b6d4", titleKey: "pl.s6.title", descKey: "pl.s6.desc", techKey: "pl.s6.tech" },
  ];

  return (
    <section id="pipeline" className="relative px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 overflow-hidden">
      <ScopeGrid />
      <div className="relative max-w-7xl mx-auto">
        <BlueprintBadge
          experiment={t("pl.experiment")}
          title={t("pl.title")}
          subtitle={t("pl.subtitle")}
          status={t("pl.status")}
          statusColor="#06b6d4"
        />

        {(() => {
          const renderStep = (s: typeof steps[number], i: number) => (
            <div
              key={s.n}
              className="lab-panel p-6 hud-frame relative animate-fade-up overflow-hidden h-full"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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
                {t(s.tagKey)}
              </div>
              <div className="font-display text-xl font-bold mt-1.5 leading-tight">{t(s.titleKey)}</div>
              <div className="font-mono text-[13px] text-[var(--color-mute)] mt-3 leading-relaxed">{t(s.descKey)}</div>
              <div className="mt-4 pt-3 border-t border-white/80 font-mono text-[11px] text-[var(--color-mute)] font-semibold">
                {t(s.techKey)}
              </div>
            </div>
          );
          return (
            <>
              <div className="md:hidden">
                <HCarousel itemWidth="86%">
                  {steps.map((s, i) => renderStep(s, i))}
                </HCarousel>
              </div>
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
