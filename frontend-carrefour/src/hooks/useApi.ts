import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "../lib/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook genérico de fetch con loading/error/refetch.
 * Cancela requests en vuelo cuando cambia path o se desmonta.
 */
export function useApi<T>(path: string): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    fetchJson<T>(path, { signal: ac.signal })
      .then((d) => {
        if (!ac.signal.aborted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });

    return () => ac.abort();
  }, [path, tick]);

  return { data, loading, error, refresh };
}
