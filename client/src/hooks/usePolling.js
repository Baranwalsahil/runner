import { useEffect, useRef } from "react";

/**
 * usePolling(fn, intervalMs)
 *
 * Calls `fn` immediately on mount and every `intervalMs` thereafter.
 * Pauses while `document.hidden === true`; on visibility return, fires
 * an immediate call and resumes the interval. Cleans up on unmount.
 *
 * Re-runs when `fn` reference or `intervalMs` change.
 */
export default function usePolling(fn, intervalMs) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;
    let timerId = null;
    let stopped = false;

    const tick = () => {
      try {
        fnRef.current?.();
      } catch {
        /* swallow per-tick errors */
      }
    };

    const start = () => {
      if (timerId != null || stopped) return;
      tick();
      timerId = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (timerId != null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    if (typeof document !== "undefined" && document.hidden) {
      // Don't start until user looks at the tab.
    } else {
      start();
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      stopped = true;
      stop();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [fn, intervalMs]);
}
