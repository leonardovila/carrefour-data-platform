/**
 * Decoración de fondo Frutiger Aero: orbes brillantes flotando + banda aero
 * cruzando suavemente. Sustituye al "osciloscopio CRT" del concept anterior.
 */
export default function ScopeGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Orbes de luz */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(190,242,100,0.55), transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(103,232,249,0.55), transparent 65%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.45), transparent 65%)",
          filter: "blur(18px)",
        }}
      />

      {/* Banda aero curvada */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 600">
        <defs>
          <linearGradient id="aero-band-bg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#bef264" stopOpacity="0" />
            <stop offset="0.3" stopColor="#bef264" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.65" />
            <stop offset="0.7" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="1" stopColor="#bef264" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 380 Q 300 280, 600 340 T 1200 300"
          fill="none"
          stroke="url(#aero-band-bg)"
          strokeWidth="3"
        />
        <path
          d="M 0 400 Q 300 300, 600 360 T 1200 320"
          fill="none"
          stroke="url(#aero-band-bg)"
          strokeWidth="1.5"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
