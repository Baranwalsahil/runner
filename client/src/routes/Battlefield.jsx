import { useRef, useState } from "react";
import MapCanvas from "../components/battlefield/MapCanvas.jsx";
import MapHud from "../components/battlefield/MapHud.jsx";
import CellDetailPanel from "../components/battlefield/CellDetailPanel.jsx";
import PlayersOnline from "../components/battlefield/PlayersOnline.jsx";
import { mockCells } from "../data/mockCells.js";

export default function Battlefield() {
  const [selectedCell, setSelectedCell] = useState(null);
  const mapRef = useRef(null);

  return (
    <section
      data-testid="battlefield"
      className="relative w-full h-[calc(100vh-7rem)] -mt-28 pt-28 overflow-hidden"
    >
      <MapCanvas
        cells={mockCells}
        onMapReady={(m) => (mapRef.current = m)}
        onCellClick={(props) => setSelectedCell(props)}
      />
      <MapHud
        liveBattles={mockCells.length}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={() => mapRef.current?.flyTo({ center: [-122.3321, 47.6062], zoom: 14 })}
      />
      <PlayersOnline />
      <CellDetailPanel
        cell={selectedCell}
        onClose={() => setSelectedCell(null)}
        onChallenge={() => setSelectedCell(null)}
      />
    </section>
  );
}
