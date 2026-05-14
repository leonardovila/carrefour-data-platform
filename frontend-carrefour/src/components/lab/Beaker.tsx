/**
 * Tubo de ensayo SVG resplandeciente. Vidrio cristal con reflejos especulares,
 * agua/lima/aqua brillante y burbujas blancas.
 */
interface BeakerProps {
  level?: number;        // 0..1 cuánto está lleno
  color?: string;        // CSS color del líquido (default lima brillante)
  size?: number;         // pixeles ancho
  bubbles?: boolean;
  label?: string;
}

export default function Beaker({
  level = 0.65,
  color = "#a3e635",
  size = 64,
  bubbles = true,
  label,
}: BeakerProps) {
  const w = size;
  const h = size * 1.45;
  const liquidHeight = 56 * level;
  const liquidY = 80 - liquidHeight;
  const idSafe = `${color.replace(/[^a-z0-9]/gi, "")}${Math.round(level * 100)}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 48 80"
      className="animate-float"
      style={{ filter: `drop-shadow(0 6px 14px ${color}66) drop-shadow(0 0 20px ${color}33)` }}
    >
      <defs>
        <linearGradient id={`liq-${idSafe}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.55" />
          <stop offset="1" stopColor={color} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`glass-${idSafe}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={`mask-${idSafe}`}>
          <path d="M14 14 H34 V70 a4 4 0 0 1 -4 4 H18 a4 4 0 0 1 -4 -4 Z" />
        </clipPath>
      </defs>

      {/* Cuerpo de vidrio */}
      <path
        d="M14 14 H34 V70 a4 4 0 0 1 -4 4 H18 a4 4 0 0 1 -4 -4 Z"
        fill={`url(#glass-${idSafe})`}
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Boca con anillo brillante */}
      <line x1="11" y1="14" x2="37" y2="14" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="13" x2="37" y2="13" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

      {/* Líquido */}
      <g clipPath={`url(#mask-${idSafe})`}>
        <rect x="14" y={liquidY} width="20" height={liquidHeight} fill={`url(#liq-${idSafe})`}>
          <animate attributeName="y" values={`${liquidY};${liquidY - 1};${liquidY}`} dur="3s" repeatCount="indefinite" />
        </rect>
        {/* Reflejo del menisco */}
        <ellipse cx="24" cy={liquidY + 1} rx="8" ry="0.9" fill="#ffffff" opacity="0.85" />
        {/* Reflejo lateral del cristal */}
        <rect x="15" y={liquidY + 2} width="1.2" height={liquidHeight - 4} fill="#ffffff" opacity="0.35" rx="0.5" />
      </g>

      {/* Burbujas blancas */}
      {bubbles && (
        <g clipPath={`url(#mask-${idSafe})`}>
          <circle cx="20" cy="60" r="1.4" fill="#ffffff" opacity="0.95">
            <animate attributeName="cy" values="70;30" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.95;0" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="24" cy="62" r="1" fill="#ffffff" opacity="0.85">
            <animate attributeName="cy" values="68;25" dur="3.1s" repeatCount="indefinite" begin="0.6s" />
            <animate attributeName="opacity" values="0;0.85;0" dur="3.1s" repeatCount="indefinite" begin="0.6s" />
          </circle>
          <circle cx="28" cy="64" r="1.1" fill="#ffffff" opacity="0.8">
            <animate attributeName="cy" values="72;28" dur="2.8s" repeatCount="indefinite" begin="1.2s" />
            <animate attributeName="opacity" values="0;0.8;0" dur="2.8s" repeatCount="indefinite" begin="1.2s" />
          </circle>
          <circle cx="22" cy="66" r="0.7" fill="#ffffff" opacity="0.7">
            <animate attributeName="cy" values="73;32" dur="2.2s" repeatCount="indefinite" begin="1.7s" />
            <animate attributeName="opacity" values="0;0.7;0" dur="2.2s" repeatCount="indefinite" begin="1.7s" />
          </circle>
        </g>
      )}

      {/* Reflejo especular del vidrio */}
      <path
        d="M16 18 Q15 40 16 68"
        stroke="#ffffff"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M32 22 Q33 35 32 50"
        stroke="#ffffff"
        strokeWidth="0.6"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />

      {/* Marcas de nivel */}
      <g stroke="rgba(15,23,42,0.4)" strokeWidth="0.5" opacity="0.6">
        <line x1="14" y1="30" x2="17" y2="30" />
        <line x1="14" y1="45" x2="17" y2="45" />
        <line x1="14" y1="60" x2="17" y2="60" />
      </g>

      {label && (
        <text
          x="24"
          y="78"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="5"
          fill="#0f172a"
          opacity="0.55"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
