import { apiJson } from "./auth.js";

function boundsToQuery({ sw_lat, sw_lng, ne_lat, ne_lng }) {
  return `${sw_lat},${sw_lng},${ne_lat},${ne_lng}`;
}

/** Map API cell row → MapCanvas cell shape. */
export function adaptApiCell(c) {
  return {
    h3Index: c.h3_index,
    ownerId: c.user_id,
    owner: c.username ? `@${c.username}` : "@unclaimed",
    color: c.color || "#c3f400",
    claimedAt: c.claimed_at,
    ownership: Math.min(100, 50 + c.claim_count * 10),
  };
}

export const territory = {
  list: async (bounds) => {
    const cells = await apiJson(`/territory?bounds=${boundsToQuery(bounds)}`);
    return cells.map(adaptApiCell);
  },
  byUser: async (userId, { limit = 50, offset = 0 } = {}) => {
    const cells = await apiJson(
      `/territory/user/${userId}?limit=${limit}&offset=${offset}`
    );
    return cells.map(adaptApiCell);
  },
  stats: () => apiJson("/territory/stats"),
};

export const leaderboard = {
  top: ({ limit = 50, offset = 0, period = "all" } = {}) =>
    apiJson(
      `/leaderboard?limit=${limit}&offset=${offset}&period=${period}`
    ),
  nearby: ({ window = 5 } = {}) =>
    apiJson(`/leaderboard/nearby?window=${window}`),
};
