import { useEffect, useState } from "react";

/**
 * One-shot wrapper around navigator.geolocation.getCurrentPosition.
 * Returns { position: {lat, lng} | null, error: string | null, loading: boolean }.
 */
export default function useCurrentLocation() {
  const [state, setState] = useState({ position: null, error: null, loading: true });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ position: null, error: "Geolocation not supported", loading: false });
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        if (cancelled) return;
        setState({ position: null, error: err.message || "Location unavailable", loading: false });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
