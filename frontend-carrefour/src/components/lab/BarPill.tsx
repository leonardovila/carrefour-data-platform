/**
 * Mini barra horizontal animada brillante. Para tablas y rankings.
 */
interface BarPillProps {
  value: number;   // 0..1
  color?: string;
  label?: string;
}
export default function BarPill({ value, color = "#84cc16", label }: BarPillProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.95)", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 relative"
          style={{
            width: `${pct * 100}%`,
            background: `linear-gradient(180deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 10px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.6)`,
          }}
        >
          <span className="absolute inset-0 animate-shimmer rounded-full" />
        </div>
      </div>
      {label && (
        <span className="font-mono text-[10px] tabular text-[var(--color-paper)] min-w-[36px] text-right font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}
