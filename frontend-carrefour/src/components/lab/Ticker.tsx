/**
 * Ticker horizontal infinito tipo bolsa. Pasa una lista de items y se repite.
 */
import type { ReactNode } from "react";

interface TickerProps {
  items: ReactNode[];
  className?: string;
}
export default function Ticker({ items, className = "" }: TickerProps) {
  if (items.length === 0) return null;
  // Duplicamos la lista para hacer el loop sin saltos
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="animate-ticker inline-flex gap-12 whitespace-nowrap">
        {doubled.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 font-mono text-xs text-[var(--color-mute)]">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
