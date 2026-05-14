import { useEffect, useRef, useState } from "react";

interface Link {
  id: string;
  num: string;
  label: string;
  color: "lime" | "aqua" | "gold" | "plum" | "blood";
  hex: string;
}
const links: Link[] = [
  { id: "termometro",  num: "01",  label: "Termómetro",       color: "lime",  hex: "#84cc16" },
  { id: "ofertas",     num: "02",  label: "Ofertas del día",  color: "gold",  hex: "#f59e0b" },
  { id: "vs-lider",    num: "03",  label: "Carrefour vs Líder", color: "blood", hex: "#ee2122" },
  { id: "marcas",      num: "04",  label: "Top marcas",        color: "aqua",  hex: "#06b6d4" },
  { id: "bajo-semana", num: "05",  label: "Lo que bajó",       color: "plum",  hex: "#a855f7" },
  { id: "pipeline",    num: "DOC", label: "Pipeline · doc",    color: "aqua",  hex: "#0891b2" },
];

function smoothJump(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, "", `#${id}`);
  }
}

/**
 * Navegación con scroll-spy + smooth-scroll:
 * - Desktop (xl+): banda horizontal sticky debajo del hero, botones grandes con paleta Aero.
 * - Mobile / tablet: dropdown fijo abajo. Click → expande lista vertical legible.
 */
export default function NavRail() {
  const [active, setActive] = useState<string>(links[0].id);
  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targets = links
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Cerrar dropdown mobile al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    smoothJump(id);
    setOpen(false);
  };

  const activeLink = links.find((l) => l.id === active) || links[0];

  return (
    <>
      {/* ════════ DESKTOP (xl+) — DOCK ALTO sticky, número gigante + label ════════ */}
      <div className="hidden xl:block sticky top-3 z-40 px-6 mt-4 mb-8">
        <nav
          className="max-w-7xl mx-auto p-3 rounded-3xl"
          aria-label="Secciones"
          style={{
            background: "#ffffff",
            border: "1.5px solid rgba(190,242,100,0.85)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(190,242,100,0.35), 0 12px 40px rgba(132,204,22,0.18), 0 24px 60px rgba(125,211,252,0.18)",
          }}
        >
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-mute)] flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #fff, #84cc16)",
                  boxShadow: "0 0 10px rgba(132,204,22,0.85)",
                }}
              />
              Navegación del laboratorio
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-faint)]">
              {links.length} experimentos · scroll-spy ON
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {links.map((l) => {
              const isActive = active === l.id;
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={handleClick(l.id)}
                  className="group relative flex flex-col items-center justify-end gap-2 px-3 pt-5 pb-4 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{
                    background: isActive
                      ? `linear-gradient(180deg, #ffffff 0%, ${l.hex}26 100%)`
                      : "#f8fafc",
                    border: isActive
                      ? `1.5px solid ${l.hex}cc`
                      : "1px solid #e2e8f0",
                    boxShadow: isActive
                      ? `inset 0 1px 0 rgba(255,255,255,1), 0 8px 24px ${l.hex}66, 0 0 32px ${l.hex}33`
                      : "inset 0 1px 0 rgba(255,255,255,1), 0 2px 6px rgba(15,23,42,0.04)",
                    transform: isActive ? "translateY(-3px)" : "translateY(0)",
                    minHeight: 110,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-2px)";
                      el.style.background = "#ffffff";
                      el.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,1), 0 8px 20px ${l.hex}40`;
                      el.style.borderColor = `${l.hex}88`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.background = "#f8fafc";
                      el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,1), 0 2px 6px rgba(15,23,42,0.04)";
                      el.style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  {/* Halo de color en el fondo */}
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle, ${l.hex}55, transparent 70%)`,
                      filter: "blur(18px)",
                      opacity: isActive ? 0.8 : 0.25,
                    }}
                  />

                  {/* Número gigante */}
                  <span
                    className="font-instrument tabular relative leading-none"
                    style={{
                      color: l.hex,
                      fontSize: 56,
                      textShadow: isActive
                        ? `0 0 20px ${l.hex}, 0 1px 0 #fff`
                        : `0 1px 0 #fff, 0 0 12px ${l.hex}44`,
                      fontWeight: 700,
                    }}
                  >
                    {l.num}
                  </span>

                  {/* Label */}
                  <span
                    className="font-display text-center leading-tight relative whitespace-nowrap"
                    style={{
                      color: isActive ? "var(--color-paper)" : "var(--color-mute)",
                      fontWeight: isActive ? 700 : 600,
                      fontSize: 13,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {l.label}
                  </span>

                  {/* Marker de activo */}
                  {isActive && (
                    <span
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full"
                      style={{
                        width: 24,
                        height: 3,
                        background: `linear-gradient(90deg, transparent, ${l.hex}, transparent)`,
                        boxShadow: `0 0 8px ${l.hex}`,
                      }}
                    />
                  )}
                </a>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ════════ MOBILE / TABLET (<xl) — dropdown desde abajo ════════ */}
      <div ref={ddRef} className="xl:hidden fixed left-2 right-2 bottom-2 z-40">
        {/* Panel desplegado · sólido, sin opacidad */}
        {open && (
          <div
            className="mb-2 p-2 animate-fade-up"
            style={{
              borderRadius: 22,
              background: "#ffffff",
              border: "1.5px solid rgba(190,242,100,0.85)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(190,242,100,0.35), 0 -8px 32px rgba(132,204,22,0.18), 0 -16px 48px rgba(125,211,252,0.16)",
            }}
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--color-mute)] px-3 py-2">
              Saltar a sección
            </div>
            <div className="flex flex-col gap-1">
              {links.map((l) => {
                const isActive = active === l.id;
                return (
                  <a
                    key={l.id}
                    href={`#${l.id}`}
                    onClick={handleClick(l.id)}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl transition"
                    style={{
                      background: isActive
                        ? `linear-gradient(180deg, #ffffff 0%, ${l.hex}26 100%)`
                        : "#f8fafc",
                      border: isActive ? `1px solid ${l.hex}88` : "1px solid #e2e8f0",
                      boxShadow: isActive ? `0 4px 14px ${l.hex}40` : "none",
                    }}
                  >
                    <span
                      className="font-instrument tabular shrink-0 w-12 text-center"
                      style={{ color: l.hex, fontSize: 28, lineHeight: 1, fontWeight: 700 }}
                    >
                      {l.num}
                    </span>
                    <span
                      className="font-display text-base"
                      style={{
                        color: "var(--color-paper)",
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {l.label}
                    </span>
                    {isActive && (
                      <span
                        className="ml-auto inline-block w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, #fff, ${l.hex})`,
                          boxShadow: `0 0 10px ${l.hex}cc`,
                        }}
                      />
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Trigger principal del dropdown · sólido */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3"
          style={{
            borderRadius: 999,
            background: "#ffffff",
            border: "1.5px solid rgba(190,242,100,0.85)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,1), 0 0 0 1px rgba(190,242,100,0.35), 0 8px 24px rgba(132,204,22,0.22), 0 16px 40px rgba(125,211,252,0.18)",
          }}
          aria-expanded={open}
        >
          <span
            className="font-instrument tabular shrink-0"
            style={{ color: activeLink.hex, fontSize: 26, lineHeight: 1, fontWeight: 700, textShadow: `0 0 10px ${activeLink.hex}aa` }}
          >
            {activeLink.num}
          </span>
          <span className="flex flex-col items-start">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--color-mute)]">
              Sección actual
            </span>
            <span className="font-display text-sm font-bold leading-tight" style={{ color: "var(--color-paper)" }}>
              {activeLink.label}
            </span>
          </span>
          <span
            className="ml-auto font-mono text-lg transition-transform duration-200 shrink-0"
            style={{
              color: "var(--color-radio-deep)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </button>
      </div>
    </>
  );
}
