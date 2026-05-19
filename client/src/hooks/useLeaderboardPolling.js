import { useCallback, useState } from "react";
import { leaderboard } from "../lib/api.js";
import usePolling from "./usePolling.js";

const LEADERBOARD_POLL_MS = 30_000;

/**
 * Polls /leaderboard every 30s. Re-fetches immediately when query opts change.
 */
export default function useLeaderboardPolling({
  limit = 50,
  offset = 0,
  period = "all",
} = {}) {
  const [page, setPage] = useState({
    rows: [],
    total: 0,
    limit,
    offset,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaderboard.top({ limit, offset, period });
      setPage(data);
    } catch (err) {
      setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, period]);

  usePolling(fetchFn, LEADERBOARD_POLL_MS);

  return { ...page, loading, error };
}
