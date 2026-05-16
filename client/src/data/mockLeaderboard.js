const USERNAMES = [
  "HEX_STALKER", "VELOCITY_KID", "GRID_WALKER", "PHANTOM_STRIDE", "APEX_PREDATOR",
  "CARBON_FIBER", "NEON_SPRINTER", "CIPHER_LEGS", "SHADOW_PACE", "QUANTUM_DASH",
  "BLAZE_RUNNER", "VECTOR_MILE", "PULSE_KILL", "GHOST_RUNNER", "STREET_KING",
  "MOUNTAIN_GOAT", "NIGHT_OWL", "SUNSET_DASH", "TRAIL_BLAZE", "LAKE_RUNNER",
  "WAVE_CREST", "WIND_RUNNER", "PACE_MAKER", "CLIFF_HANGER", "SOLAR_FLARE",
  "ECHO_TRACE", "RIFT_WALKER", "DAWN_RAIDER", "STORM_PACE", "FORGE_RUNNER",
  "PRISM_LEGS", "DUSK_DRIFTER", "MERCURY_QC", "TITAN_STRIDE", "NEBULA_PACE",
  "FLUX_RUNNER", "AURORA_DASH", "OXIDE_KICK", "RAVEN_GAIT", "MIRAGE_PACE",
  "RELIC_HUNT", "CRYO_SPRINT", "ZENITH_RUN", "ATLAS_MILE", "RIVAL_LEGS",
  "MONARCH_QC", "PYRE_STRIDE", "OBELISK_RUN", "HALO_GAIT", "CRESCENT_PACE",
];

const REGIONS = [
  "Berlin Grid", "Neo Tokyo", "London Sector", "San Francisco", "Singapore Hub",
  "Melbourne Zone", "New York North", "Seattle Pacific", "Paris Quadrant", "São Paulo Mesh",
];

function deterministicCells(i) {
  return 22000 - i * 380 - ((i * 137) % 90);
}

function deterministicStreak(i) {
  return 5 + ((i * 17) % 27);
}

function areaForCells(cells) {
  return Math.round(cells * 110000);
}

export const CURRENT_USER_ID = "me";

export const mockLeaderboard = USERNAMES.map((name, i) => {
  const cells = deterministicCells(i);
  return {
    id: `u${i + 1}`,
    rank: i + 1,
    username: `@${name}`,
    avatar: `https://i.pravatar.cc/64?u=${name}`,
    cells,
    areaM2: areaForCells(cells),
    streak: deterministicStreak(i),
    region: REGIONS[i % REGIONS.length],
  };
});

mockLeaderboard.push({
  id: CURRENT_USER_ID,
  rank: 42,
  username: "@YOU",
  avatar: null,
  cells: 1894,
  areaM2: areaForCells(1894),
  streak: 12,
  region: "New York North",
  isCurrentUser: true,
});

mockLeaderboard.sort((a, b) => b.cells - a.cells);
mockLeaderboard.forEach((p, i) => (p.rank = i + 1));

export const REGION_FILTERS = ["Global", "Regional", "Friends"];
export const TIME_FILTERS = ["All-time", "Weekly", "Daily"];
