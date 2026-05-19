import { useRef, useState } from "react";
import MapCanvas from "../components/battlefield/MapCanvas.jsx";
import MapHud from "../components/battlefield/MapHud.jsx";
import CellDetailPanel from "../components/battlefield/CellDetailPanel.jsx";
import PlayersOnline from "../components/battlefield/PlayersOnline.jsx";
import useTerritoryPolling from "../hooks/useTerritoryPolling.js";
import useLeaderboardPolling from "../hooks/useLeaderboardPolling.js";

const SEATTLE_DEFAULT_BOUNDS = {
  sw_lat: 47.59,
  sw_lng: -122.36,
  ne_lat: 47.63,
  ne_lng: -122.30,
};

function rowToPlayer(row) {
  return {
    id: row.user_id,
    handle: `@${row.username}`,
    cells: row.total_cells,
  };
}

export default function Battlefield() {
  const [selectedCell, setSelectedCell] = useState(null);
  const [bounds, setBounds] = useState(SEATTLE_DEFAULT_BOUNDS);
  const mapRef = useRef(null);
  const { cells, loading, error } = useTerritoryPolling(bounds);
  const { rows: lbRows } = useLeaderboardPolling({ limit: 3, offset: 0 });
  const players = (lbRows ?? []).map(rowToPlayer);

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
      <MapCanvas
        cells={cells}
        onMapReady={handleMapReady}
        onCellClick={(props) => setSelectedCell(props)}
      />
      <MapHud
        liveBattles={cells.length}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={() => mapRef.current?.flyTo({ center: [-122.3321, 47.6062], zoom: 14 })}
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
