/**
 * Voltímetro analógico SVG con dial de cristal blanco translúcido,
 * arco coloreado brillante y aguja con halo.
 */
interface VoltimeterProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;       // color principal del arco (default lima)
  size?: number;
}

export default function Voltimeter({
  value,
  max,
  label,
  unit = "",
  color = "#84cc16",
  size = 200,
}: VoltimeterProps) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const arcRadius = 70;
  const cx = 90;
  const cy = 90;

  const polar = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start = polar(180, arcRadius);
  const end = polar(0, arcRadius);
  const tick = (deg: number) => {
    const a = polar(deg, arcRadius - 5);
    const b = polar(deg, arcRadius + 5);
    return `M${a.x},${a.y} L${b.x},${b.y}`;
  };

  const needleLen = arcRadius - 8;
  const needleEnd = polar(180 + 180 * ratio, needleLen);

  const display = unit === "$"
    ? `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`
    : `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}${unit}`;

  const safeId = label.replace(/\s/g, "");

  return (
    <div className="lab-panel hud-frame inline-flex flex-col items-center px-7 py-7" style={{ minWidth: size + 24 }}>
      <svg viewBox="0 0 180 110" width={size} height={size * 110 / 180}>
        <defs>
          <linearGradient id={`arc-${safeId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={color} stopOpacity="0.3" />
            <stop offset="0.5" stopColor={color} stopOpacity="0.85" />
            <stop offset="1" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <radialGradient id={`dial-${safeId}`} cx="0.5" cy="0.5" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
          </radialGradient>
          <filter id={`glow-${safeId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fondo del dial blanco translúcido */}
        <path
          d={`M ${start.x} ${start.y} A ${arcRadius} ${arcRadius} 0 0 1 ${end.x} ${end.y} L ${cx} ${cy} Z`}
          fill={`url(#dial-${safeId})`}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="0.8"
        />

        {/* Arco brillante */}
        <path
          d={`M ${start.x} ${start.y} A ${arcRadius} ${arcRadius} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={`url(#arc-${safeId})`}
          strokeWidth="7"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 2px 8px ${color}aa)` }}
        />

        {/* Ticks oscuros legibles sobre el dial blanco */}
        {[180, 195, 225, 255, 270, 285, 315, 345, 360].map((d) => (
          <path key={d} d={tick(d)} stroke="rgba(15,23,42,0.55)" strokeWidth="1.2" strokeLinecap="round" />
        ))}

        {/* Aguja con halo */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          filter={`url(#glow-${safeId})`}
          style={{ transition: "all 800ms cubic-bezier(.34,1.56,.64,1)" }}
        />
        {/* Pivote */}
        <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke={color} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="2" fill={color} />
      </svg>

      <div
        className="font-instrument text-5xl md:text-6xl tabular leading-none mt-2"
        style={{ color: color, textShadow: `0 1px 0 #fff, 0 0 14px ${color}66` }}
      >
        {display}
      </div>
      <div className="font-mono text-[13px] font-bold uppercase tracking-[0.18em] text-[var(--color-paper)] mt-3">
        {label}
      </div>
      <div className="font-mono text-[11px] tabular text-[var(--color-mute)] mt-1.5">
        sample · ratio {(ratio * 100).toFixed(0)}%
      </div>
    </div>
  );
}
