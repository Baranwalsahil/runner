import { useEffect, useState } from "react";
import { territory } from "../lib/api.js";

const DEBOUNCE_MS = 500;

/**
 * useTerritory(bounds) — fetches cells in bbox on bounds change with
 * 500ms debounce. Bounds is `{sw_lat, sw_lng, ne_lat, ne_lng}` or null.
 */
export default function useTerritory(bounds) {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bounds) {
      setCells([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await territory.list(bounds);
        if (!cancelled) setCells(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    bounds?.sw_lat,
    bounds?.sw_lng,
    bounds?.ne_lat,
    bounds?.ne_lng,
  ]);

  return { cells, loading, error };
}
