import { useEffect, useRef, useState } from "react";
import MapCanvas from "../components/battlefield/MapCanvas.jsx";
import MapHud from "../components/battlefield/MapHud.jsx";
import CellDetailPanel from "../components/battlefield/CellDetailPanel.jsx";
import PlayersOnline from "../components/battlefield/PlayersOnline.jsx";
import useTerritoryPolling from "../hooks/useTerritoryPolling.js";
import useLeaderboardPolling from "../hooks/useLeaderboardPolling.js";
import useCurrentLocation from "../hooks/useCurrentLocation.js";

const VIEWPORT_HALF_DEG = 0.02; // ~2.2km radius initial bounds

function rowToPlayer(row) {
  return {
    id: row.user_id,
    handle: `@${row.username}`,
    cells: row.total_cells,
  };
}

export default function Battlefield() {
  const [selectedCell, setSelectedCell] = useState(null);
  const { position: currentLocation, loading: locLoading, error: locError } =
    useCurrentLocation();
  const initialBounds = currentLocation
    ? {
        sw_lat: currentLocation.lat - VIEWPORT_HALF_DEG,
        sw_lng: currentLocation.lng - VIEWPORT_HALF_DEG,
        ne_lat: currentLocation.lat + VIEWPORT_HALF_DEG,
        ne_lng: currentLocation.lng + VIEWPORT_HALF_DEG,
      }
    : null;
  const [bounds, setBounds] = useState(initialBounds);
  const mapRef = useRef(null);

  // Once we get location, seed bounds + recenter map.
  useEffect(() => {
    if (!currentLocation) return;
    const next = {
      sw_lat: currentLocation.lat - VIEWPORT_HALF_DEG,
      sw_lng: currentLocation.lng - VIEWPORT_HALF_DEG,
      ne_lat: currentLocation.lat + VIEWPORT_HALF_DEG,
      ne_lng: currentLocation.lng + VIEWPORT_HALF_DEG,
    };
    setBounds((prev) => prev ?? next);
    mapRef.current?.flyTo?.({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 14,
      essential: true,
    });
  }, [currentLocation?.lat, currentLocation?.lng]);

  function flyToMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.flyTo?.({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
        });
      },
      () => {}
    );
  }
  const { cells, loading, error } = useTerritoryPolling(bounds);
  const { rows: lbRows } = useLeaderboardPolling({ limit: 3, offset: 0 });
  const players = (lbRows ?? []).map(rowToPlayer);

  const legend = (() => {
    const byOwner = new Map();
    for (const c of cells) {
      const key = c.ownerId ?? c.owner;
      const existing = byOwner.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byOwner.set(key, {
          ownerId: c.ownerId,
          owner: c.owner,
          color: c.color,
          count: 1,
        });
      }
    }
    return [...byOwner.values()].sort((a, b) => b.count - a.count);
  })();

  function handleMapReady(map) {
    mapRef.current = map;
    const updateBounds = () => {
      const b = map.getBounds?.();
      if (!b) return;
      setBounds({
        sw_lat: b.getSouth(),
        sw_lng: b.getWest(),
        ne_lat: b.getNorth(),
        ne_lng: b.getEast(),
      });
    };
    map.on?.("moveend", updateBounds);
    updateBounds();
  }

  return (
    <section
      data-testid="battlefield"
      className="relative w-full h-[calc(100vh-7rem)] -mt-28 pt-28 overflow-hidden"
    >
      {currentLocation ? (
        <MapCanvas
          cells={cells}
          center={{ lat: currentLocation.lat, lng: currentLocation.lng, zoom: 14 }}
          zoom={14}
          onMapReady={handleMapReady}
          onCellClick={(props) => setSelectedCell(props)}
        />
      ) : (
        <div
          data-testid="battlefield-location-status"
          className="absolute inset-0 flex items-center justify-center bg-surface-container-low"
        >
          <div className="glass-panel neon-border-cyan rounded-lg px-md py-md text-center font-label-bold uppercase tracking-widest text-sm max-w-md">
            {locLoading
              ? "Locating you…"
              : locError
                ? `Location unavailable: ${locError}. Enable GPS to view the battlefield.`
                : "Awaiting location"}
          </div>
        </div>
      )}
      <MapHud
        liveBattles={cells.length}
        legend={legend}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={flyToMyLocation}
      />
      <PlayersOnline players={players} />
      <CellDetailPanel
        cell={selectedCell}
        onClose={() => setSelectedCell(null)}
        onChallenge={() => setSelectedCell(null)}
      />
      {(loading || error) && (
        <div
          data-testid="territory-status"
          className="absolute top-2 left-2 z-50 rounded-md bg-surface/80 px-md py-xs text-xs font-mono uppercase tracking-wider text-on-surface-variant"
        >
          {error ? `Error: ${error}` : "Loading…"}
        </div>
      )}
    </section>
  );
}
