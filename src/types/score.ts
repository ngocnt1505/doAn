/* =============================================================================
 * src/types/score.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The shared shape of a leaderboard entry, used by BOTH the server (API route +
 *   db layer) and the browser (fetch client + Leaderboard UI). Defining it once
 *   here keeps the HTTP contract type-safe end to end.
 *
 * WHAT BELONGS HERE
 *   - The stored `Score` shape (camelCase, as sent over the wire)
 *   - The `NewScore` payload a client POSTs to record a finished run
 *
 * WHAT DOES NOT BELONG HERE
 *   - SQL / table layout (snake_case columns live in `src/lib/db.ts`)
 *   - fetch wrappers (→ `src/lib/scoresApi.ts`)
 * ============================================================================= */

/** One row of the leaderboard, as returned by `GET /api/scores`. */
export interface Score {
  id: number;
  /** Display name the player entered on the start screen. */
  name: string;
  /** Total active play time of the run, in milliseconds (lower = faster). */
  timeMs: number;
  /** Furthest wave the player reached, 1..3. */
  waveReached: number;
  /** True if the player cleared all three waves. */
  won: boolean;
  /** Epoch milliseconds the run was recorded (Date.now()). */
  createdAt: number;
  /** 1-based position in the ranking, assigned by the API after sorting. */
  rank: number;
}

/** The body a client sends to `POST /api/scores` to record a finished run. The
 *  server assigns `id`, `createdAt` and `rank`. */
export interface NewScore {
  name: string;
  timeMs: number;
  waveReached: number;
  won: boolean;
}
