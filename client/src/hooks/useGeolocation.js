import { useCallback, useEffect, useRef, useState } from "react";

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

/**
 * Wraps navigator.geolocation.watchPosition.
 * Exposes points[], isRecording, error, plus start/stop/clear.
 */
export default function useGeolocation() {
  const [points, setPoints] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    if (watchIdRef.current !== null) return;
    setError(null);
    setIsRecording(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        setPoints((prev) => [
          ...prev,
          {
            lat: latitude,
            lng: longitude,
            accuracy,
            alt: altitude ?? null,
            timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
          },
        ]);
      },
      (err) => {
        setError(err.message || "Geolocation error");
      },
      WATCH_OPTIONS
    );
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null && navigator?.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsRecording(false);
  }, []);

  const clear = useCallback(() => {
    setPoints([]);
    setError(null);
  }, []);

  // Seed the trace from a restored session (refresh resilience).
  const hydrate = useCallback((initialPoints) => {
    if (Array.isArray(initialPoints) && initialPoints.length > 0) {
      setPoints(initialPoints);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, []);

  return { points, isRecording, error, start, stop, clear, hydrate };
}
