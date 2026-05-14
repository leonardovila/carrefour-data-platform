/**
 * Loader temático: anillos brillantes rotando.
 */
export default function Centrifuge({ label = "Procesando muestra" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle, rgba(190,242,100,0.3), transparent 60%)" }}
        />
        <svg width="72" height="72" viewBox="0 0 72 72" className="animate-spin-slow relative">
          <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(132,204,22,0.2)" strokeWidth="2" strokeDasharray="4 6" />
          <circle cx="36" cy="36" r="26" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeDasharray="22 16" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(132,204,22,0.7))" }} />
          <circle cx="36" cy="36" r="18" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="10 5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.7))" }} />
          <circle cx="36" cy="36" r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.7))" }} />
          <circle cx="36" cy="36" r="3.5" fill="#84cc16" style={{ filter: "drop-shadow(0 0 4px rgba(132,204,22,0.9))" }} />
          <line x1="36" y1="6" x2="36" y2="14" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="66" y1="36" x2="58" y2="36" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--color-mute)] lab-cursor">
        {label}
      </div>
    </div>
  );
}
