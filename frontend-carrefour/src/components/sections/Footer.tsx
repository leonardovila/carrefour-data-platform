import { useI18n } from "../../i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative border-t border-[var(--color-grid)] mt-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-mute)]">
            {t("ft.labOperator")}
          </div>
          <div className="font-display text-xl font-bold mt-2">
            <span className="neon-green">Leonardo</span> Vila
          </div>
          <div className="font-mono text-xs text-[var(--color-mute)] mt-1">
            Buenos Aires
          </div>
          <div className="mt-3 flex gap-4 font-mono text-xs">
            <a href="https://www.leonardovila.com" target="_blank" rel="noopener" className="text-[var(--color-paper)] hover:neon-green transition">
              ↗ leonardovila.com
            </a>
            <a href="https://app.leonardovila.com" target="_blank" rel="noopener" className="text-[var(--color-paper)] hover:neon-cyan transition">
              ↗ Financial data lab
            </a>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-mute)]">
            {t("ft.sampleFreq")}
          </div>
          <div className="font-instrument text-2xl neon-cyan mt-2 tabular">{t("ft.daily")}</div>
          <div className="font-mono text-xs text-[var(--color-mute)] mt-2 leading-relaxed">
            {t("ft.pipelineDesc")}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-mute)]">
            {t("ft.disclaimer")}
          </div>
          <div className="font-mono text-xs text-[var(--color-mute)] mt-2 leading-relaxed">
            {t("ft.disclaimerText")}
          </div>
        </div>
      </div>

      <div className="border-t border-white/80 py-3 glass">
        <div className="max-w-7xl mx-auto px-6 font-mono text-[10px] text-[var(--color-faint)] flex flex-wrap items-center gap-x-6 gap-y-1">
          <span>© {new Date().getFullYear()} Leonardo Vila</span>
          <span className="text-[var(--color-radio)]">●</span>
          <span>Stack: Python · curl_cffi · PyArrow · DuckDB · S3 · Glue · Athena · FastAPI · React · Vite</span>
          <span className="text-[var(--color-arc)]">●</span>
          <span>Hosting: VPS DigitalOcean (NYC) + AWS us-east-2</span>
        </div>
      </div>
    </footer>
  );
}
