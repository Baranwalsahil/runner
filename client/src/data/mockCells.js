import { latLngToCell, gridDisk } from "h3-js";
import { SEATTLE } from "../lib/mapStyle.js";

export const OWNERS = [
  { id: "self", name: "@YOU", color: "#c3f400" },
  { id: "ghost", name: "@GhostRunner", color: "#00dbe9" },
  { id: "apex", name: "@Apex", color: "#ffb4ab" },
  { id: "king", name: "@StreetKing", color: "#ffdad5" },
];

const H3_RES = 9;

export function generateMockCells({ center = SEATTLE, k = 4, owners = OWNERS } = {}) {
  const centerCell = latLngToCell(center.lat, center.lng, H3_RES);
  const ring = gridDisk(centerCell, k);
  return ring.map((h3Index, i) => {
    const owner = owners[i % owners.length];
    return {
      h3Index,
      ownerId: owner.id,
      owner: owner.name,
      color: owner.color,
      claimedAt: new Date(Date.now() - i * 3600_000).toISOString(),
      ownership: 60 + ((i * 7) % 41),
    };
  });
}

export const mockCells = generateMockCells();
