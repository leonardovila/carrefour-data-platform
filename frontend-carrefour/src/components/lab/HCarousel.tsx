import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface HCarouselProps {
  children: ReactNode[];
  /** Ancho de cada item (CSS): default 86% para que se asome el próximo. */
  itemWidth?: string;
  /** Mostrar dots de progreso. */
  dots?: boolean;
  /** Mostrar flechas prev/next. */
  arrows?: boolean;
  className?: string;
}

/**
 * Scroll horizontal con snap + flechas + dots de progreso.
 * Pensado para listas largas en mobile que en desktop son grids.
 */
export default function HCarousel({
  children,
  itemWidth = "86%",
  dots = true,
  arrows = true,
  className = "",
}: HCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollByDir = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const step = el.clientWidth * 0.86;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const scrollToIdx = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / (el.clientWidth * 0.86));
      setActiveIdx(Math.max(0, Math.min(children.length - 1, idx)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [children.length]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 -mx-4 px-4 scroll-smooth"
        style={{ scrollPaddingLeft: "1rem" }}
      >
        {children.map((c, i) => (
          <div key={i} className="snap-start shrink-0" style={{ width: itemWidth }}>
            {c}
          </div>
        ))}
      </div>

      {arrows && children.length > 1 && (
        <>
          <button
            onClick={() => scrollByDir(-1)}
            aria-label="Anterior"
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/95 grid place-items-center text-[var(--color-radio-deep)] font-bold shadow-md active:scale-95 transition"
            style={{ display: activeIdx === 0 ? "none" : "grid" }}
          >
            ←
          </button>
          <button
            onClick={() => scrollByDir(1)}
            aria-label="Siguiente"
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass border border-white/95 grid place-items-center text-[var(--color-radio-deep)] font-bold shadow-md active:scale-95 transition"
            style={{ display: activeIdx >= children.length - 1 ? "none" : "grid" }}
          >
            →
          </button>
        </>
      )}

      {dots && children.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIdx(i)}
              aria-label={`Ir al item ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width: i === activeIdx ? 18 : 6,
                height: 6,
                background:
                  i === activeIdx
                    ? "linear-gradient(90deg, #84cc16, #06b6d4)"
                    : "rgba(15,23,42,0.18)",
                boxShadow: i === activeIdx ? "0 0 8px rgba(132,204,22,0.55)" : "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
