import { create } from "zustand";

interface DashboardStore {
  refreshSeed: number;
  triggerGlobalRefresh: () => void;
}

/**
 * Store global mínimo. Botón "Re-extraer muestra" del header dispara
 * `triggerGlobalRefresh()` y los hooks pueden suscribirse a `refreshSeed`
 * para re-fetchearse.
 */
export const useDashboardStore = create<DashboardStore>((set) => ({
  refreshSeed: 0,
  triggerGlobalRefresh: () => set((s) => ({ refreshSeed: s.refreshSeed + 1 })),
}));
