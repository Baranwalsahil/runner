import { apiJson } from "./auth.js";

function boundsToQuery({ sw_lat, sw_lng, ne_lat, ne_lng }) {
  return `${sw_lat},${sw_lng},${ne_lat},${ne_lng}`;
}

/** Map API cell row → MapCanvas cell shape. */
export function adaptApiCell(c) {
  const shares = (c.shares || []).map((s) => ({
    userId: s.user_id,
    owner: s.username ? `@${s.username}` : "@unclaimed",
    color: s.color || "#c3f400",
    count: s.count,
  }));
  const total = shares.reduce((sum, s) => sum + s.count, 0);
  const ownerCount = shares.length ? shares[0].count : c.claim_count;
  return {
    h3Index: c.h3_index,
    ownerId: c.user_id,
    owner: c.username ? `@${c.username}` : "@unclaimed",
    color: c.color || "#c3f400",
    claimedAt: c.claimed_at,
    // Owner's slice of total strength on the cell.
    ownership: total ? Math.round((ownerCount / total) * 100) : 100,
    shares,
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

export const runs = {
  feed: ({ limit = 12 } = {}) =>
    apiJson(`/runs/feed?limit=${limit}`),
  list: () => apiJson("/runs"),
  detail: (id) => apiJson(`/runs/${id}/detail`),
};
