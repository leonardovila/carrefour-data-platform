import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useDashboardStore } from "../../stores/useStore";
import type { CloudResponse, TermometroRow } from "../../types";
import { compactNumber, formatFecha, intStr, money } from "../../lib/format";
import PulseCircle from "../lab/PulseCircle";
import Beaker from "../lab/Beaker";
import Ticker from "../lab/Ticker";

const RUN_ID = `LAB-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(
  new Date().getDate()
).padStart(2, "0")}`;

export default function HeroPanel() {
  const { refreshSeed } = useDashboardStore();
  const term = useApi<CloudResponse<TermometroRow>>(`/cloud/termometro?_=${refreshSeed}`);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const r = term.data?.rows[0];
  const productos = intStr(r?.productos_disponibles);
  const marcas = intStr(r?.marcas_activas);
  const cats = intStr(r?.categorias_con_stock);
  const ofertas = intStr(r?.productos_en_oferta);
  const ahorroTotal = intStr(r?.ahorro_total_disponible_ars);

  const tickerItems = [
    <>
      <span className="text-[var(--color-radio)]">●</span>
      <span>VPS DigitalOcean (NYC)</span>
    </>,
    <>
      <span className="text-[var(--color-arc)]">●</span>
      <span>Bronze layer en S3 us-east-2</span>
    </>,
    <>
      <span className="text-[var(--color-plasma)]">●</span>
      <span>Catálogo Carrefour AR</span>
    </>,
    <>
      <span className="text-[var(--color-warn)]">●</span>
      <span>Athena workgroup carrefour-wg</span>
    </>,
    <>
      <span className="text-[var(--color-radio)]">●</span>
      <span>Cron diario @ 03:30 ART</span>
    </>,
    <>
      <span className="text-[var(--color-arc)]">●</span>
      <span>11 vistas SQL aplicadas</span>
    </>,
    <>
      <span className="text-[var(--color-plasma)]">●</span>
      <span>444 categorías hoja descubiertas</span>
    </>,
  ];

  return (
    <header className="relative overflow-hidden">
      {/* Tape arriba: gradient resplandeciente lima-aqua-dorado */}
      <div
        className="py-1.5 overflow-hidden whitespace-nowrap relative"
        style={{
          background:
            "linear-gradient(90deg, #d9f99d 0%, #a5f3fc 35%, #fde68a 70%, #d9f99d 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 2px 12px rgba(132,204,22,0.25), inset 0 1px 0 rgba(255,255,255,0.95)",
          color: "#1e293b",
        }}
      >
        <Ticker
          items={[
            <span key="1">✦ MUESTRA EN VIVO · CATÁLOGO CARREFOUR ARGENTINA · {formatFecha(r?.fecha)}</span>,
            <span key="2">✦ {compactNumber(productos)} PRODUCTOS DETECTADOS HOY · {compactNumber(ofertas)} EN OFERTA</span>,
            <span key="3">✦ AHORRO ACUMULADO DISPONIBLE: {money(ahorroTotal)}</span>,
            <span key="4">✦ INSTRUMENTAL: PYTHON + DUCKDB + ATHENA · INGESTA: TLS IMPERSONATION + BACKOFF EXPONENCIAL</span>,
          ]}
          className="font-mono text-[11px] font-bold tracking-wider"
        />
      </div>

      <div className="relative px-4 sm:px-6 md:px-12 py-10 sm:py-14 md:py-20">
        {/* Orbes brillantes detrás del header */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 left-1/4 w-[32rem] h-[32rem] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(190,242,100,0.6), transparent 65%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute top-10 right-0 w-[28rem] h-[28rem] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(125,211,252,0.55), transparent 65%)",
              filter: "blur(36px)",
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-[20rem] h-[20rem] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(251,191,36,0.45), transparent 65%)",
              filter: "blur(32px)",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1fr_auto] gap-12 items-end">
          {/* IZQ: Headline */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="lab-tape">{RUN_ID}</div>
              <div className="gold-pill">
                <PulseCircle />
                <span>DATOS EN VIVO</span>
              </div>
              <span className="font-mono text-[10px] tabular text-[var(--color-mute)]">
                {now.toISOString().slice(11, 19)} UTC
              </span>
            </div>

            <h1 className="font-display font-bold leading-[0.95] tracking-tight text-shadow-soft">
              <span className="block text-[var(--color-mute)] text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 font-normal">
                Laboratorio de
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="neon-green">Góndola</span>
                <span className="text-[var(--color-faint)] font-mono mx-2 sm:mx-3 text-2xl sm:text-3xl">/</span>
                <span className="neon-blood">Carrefour</span>
              </span>
              <span className="block font-mono text-sm sm:text-base md:text-lg text-[var(--color-mute)] mt-4 sm:mt-5 tracking-tight">
                Inteligencia comercial sobre{" "}
                <span className="text-[var(--color-paper)] font-bold neon-green">{compactNumber(productos)}</span>{" "}
                productos ·{" "}
                <span className="text-[var(--color-paper)] font-bold neon-cyan">{compactNumber(marcas)}</span>{" "}
                marcas activas ·{" "}
                <span className="text-[var(--color-paper)] font-bold neon-plasma">{cats}</span> categorías de hoy.
              </span>
            </h1>

            <div className="mt-9 flex items-center gap-5 flex-wrap">
              <a
                href="#pipeline"
                className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-mute)] hover:text-[var(--color-radio-deep)] transition"
              >
                ¿Cómo se construye? →
              </a>
              <a
                href="https://www.leonardovila.com"
                target="_blank"
                rel="noopener"
                className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-mute)] hover:text-[var(--color-arc-deep)] transition"
              >
                ← Volver al sitio del operador
              </a>
            </div>
          </div>

          {/* DER: Beakers decorativos con KPIs */}
          <div className="hidden md:flex items-end gap-4">
            <div className="flex flex-col items-center">
              <Beaker level={Math.min(0.95, productos / 25000)} color="#84cc16" size={56} />
              <span className="font-mono text-[9px] text-[var(--color-mute)] mt-1 uppercase tracking-widest">SKUs</span>
              <span className="font-instrument neon-green text-xl tabular leading-none">{compactNumber(productos)}</span>
            </div>
            <div className="flex flex-col items-center">
              <Beaker level={Math.min(0.95, marcas / 2500)} color="#06b6d4" size={56} />
              <span className="font-mono text-[9px] text-[var(--color-mute)] mt-1 uppercase tracking-widest">Marcas</span>
              <span className="font-instrument neon-cyan text-xl tabular leading-none">{compactNumber(marcas)}</span>
            </div>
            <div className="flex flex-col items-center">
              <Beaker level={Math.min(0.95, ofertas / 5000)} color="#fbbf24" size={56} />
              <span className="font-mono text-[9px] text-[var(--color-mute)] mt-1 uppercase tracking-widest">Ofertas</span>
              <span className="font-instrument neon-plasma text-xl tabular leading-none">{compactNumber(ofertas)}</span>
            </div>
          </div>
        </div>

        {/* Operator stamp - solo desktop */}
        <div className="absolute right-6 top-6 hidden lg:block">
          <div className="hud-frame px-4 py-2.5 lab-panel">
            <div className="font-mono text-[9px] text-[var(--color-faint)] tracking-widest">OPERATOR</div>
            <div className="font-display text-sm font-bold neon-green">LEO.V</div>
            <div className="font-mono text-[9px] text-[var(--color-mute)] tracking-widest">DATA · ENG</div>
          </div>
        </div>

        {/* Banda aero al pie del hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-1">
          <div className="aero-band" />
        </div>
      </div>

      {/* Ticker inferior */}
      <div className="border-y border-white/80 py-2.5 glass">
        <Ticker items={tickerItems} className="px-6" />
      </div>
    </header>
  );
}
