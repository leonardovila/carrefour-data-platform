// Cliente fetch sencillo con base URL configurable.
// Resolucion en orden:
//   1. VITE_API_BASE   (override explicito de build)
//   2. localhost runtime → asumimos API local en :8002
//   3. mismo origen      (prod tras nginx reverse proxy)

const inferBase = (): string => {
  const override = import.meta.env.VITE_API_BASE as string | undefined;
  if (override) return override;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") return "http://127.0.0.1:8002";
    // En producción servimos atrás de nginx; los endpoints viven en /api/carrefour-data/*
    return "/api/carrefour-data";
  }
  return "";
};

const API_BASE = inferBase();

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${text.slice(0, 160)}`);
  }
  return res.json() as Promise<T>;
}
