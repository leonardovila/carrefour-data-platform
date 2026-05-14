/**
 * Indicador "señal viva": círculo con halo radiante.
 */
export default function PulseCircle({ color = "#84cc16", size = 12 }: { color?: string; size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="absolute rounded-full"
        style={{
          inset: -4,
          background: `radial-gradient(circle, ${color}66, transparent 70%)`,
          animation: "haloPulse 1.6s ease-in-out infinite",
        }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${color} 60%)`,
          boxShadow: `0 0 8px ${color}cc, inset 0 1px 0 rgba(255,255,255,0.9)`,
        }}
      />
    </span>
  );
}
