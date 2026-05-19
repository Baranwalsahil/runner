import { useCallback, useState } from "react";
import { territory } from "../lib/api.js";
import usePolling from "./usePolling.js";

const TERRITORY_POLL_MS = 15_000;

/**
 * Polls /territory for the given bounds every 15s while the tab is visible,
 * and refetches immediately when bounds change.
 */
export default function useTerritoryPolling(bounds) {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFn = useCallback(async () => {
    if (!bounds) return;
    setLoading(true);
    setError(null);
    try {
      const data = await territory.list(bounds);
      setCells(data);
    } catch (err) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [bounds?.sw_lat, bounds?.sw_lng, bounds?.ne_lat, bounds?.ne_lng]);

  usePolling(fetchFn, bounds ? TERRITORY_POLL_MS : 0);

  return { cells, loading, error };
}
