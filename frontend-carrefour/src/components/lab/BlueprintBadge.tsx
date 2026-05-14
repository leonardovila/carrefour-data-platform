import type { ReactNode } from "react";

interface BlueprintBadgeProps {
  experiment: string;       // "EXPERIMENTO N°01"
  title: ReactNode;         // titulo grande (puede tener spans con neon)
  subtitle?: ReactNode;     // descripción narrativa
  status?: string;          // "ACTIVO", "EN CURSO"
  statusColor?: string;
}

/**
 * Encabezado de cada sección con vibe de "panel del laboratorio":
 * etiqueta de experimento, título grande y un metadato vivo.
 */
export default function BlueprintBadge({
  experiment,
  title,
  subtitle,
  status = "ACTIVO",
  statusColor = "#84cc16",
}: BlueprintBadgeProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="lab-tape">{experiment}</span>
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.2em] font-bold border"
          style={{
            color: statusColor,
            background: "rgba(255,255,255,0.85)",
            borderColor: `${statusColor}66`,
            boxShadow: `0 4px 12px ${statusColor}33, inset 0 1px 0 rgba(255,255,255,0.95)`,
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, #fff 0%, ${statusColor} 60%)`,
              boxShadow: `0 0 8px ${statusColor}cc`,
            }}
          />
          {status}
        </span>
      </div>
      <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 leading-[1.05] tracking-tight text-shadow-soft">
        {title}
      </h2>
      {subtitle && (
        <div className="font-mono text-sm text-[var(--color-mute)] mt-3 max-w-2xl leading-relaxed">
          {subtitle}
        </div>
      )}
    </div>
  );
}
