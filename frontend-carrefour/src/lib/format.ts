// Helpers de formato para narrativa "doméstica" en castellano.

const ARS = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const ARSdec = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

export function money(value: number | string | null | undefined, opts?: { withDecimals?: boolean; sign?: boolean }): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  const s = (opts?.withDecimals ? ARSdec : ARS).format(Math.abs(n));
  const prefix = n < 0 ? "-$" : opts?.sign && n > 0 ? "+$" : "$";
  return `${prefix}${s}`;
}

export function pct(value: number | string | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(fractionDigits)}%`;
}

export function compactNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
}

export function intStr(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? 0 : Math.round(n);
}

export function floatStr(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

const FECHA_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return FECHA_FMT.format(d);
}

// VTEX devuelve `link` como path relativo (ej "/producto-slug/p"). Si lo
// renderizamos crudo, el browser lo resuelve contra nuestro propio dominio
// y nginx tira 404. Garantizamos siempre URL absoluta a carrefour.com.ar.
const CARREFOUR_BASE = "https://www.carrefour.com.ar";

export function productUrl(url: string | null | undefined): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${CARREFOUR_BASE}${url}` : `${CARREFOUR_BASE}/${url}`;
}
