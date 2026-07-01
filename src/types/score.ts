// The shared shape of a leaderboard entry, used by both the server (API route +
// db) and the browser (fetch client + UI), so the HTTP contract is type-safe.

// One row of the leaderboard, as returned by GET /api/scores.
export interface Score {
  id: number;
  name: string;
  // Total active play time of the run, in milliseconds (lower = faster).
  timeMs: number;
  // Furthest wave the player reached, 1..3.
  waveReached: number;
  // True if the player cleared all three waves.
  won: boolean;
  // Epoch milliseconds the run was recorded.
  createdAt: number;
  // 1-based position in the ranking, assigned by the API after sorting.
  rank: number;
}

// The body a client sends to POST /api/scores. The server assigns id, createdAt
// and rank.
export interface NewScore {
  name: string;
  timeMs: number;
  waveReached: number;
  won: boolean;
}
