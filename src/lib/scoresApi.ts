/* =============================================================================
 * src/lib/scoresApi.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The browser-side client for the leaderboard API. Thin, typed wrappers around
 *   `fetch` so components never hand-roll URLs, headers or response parsing — they
 *   just `await getScores()` / `await postScore(...)`. This is the seam between
 *   the UI Layer and the backend (`/api/scores`).
 *
 * WHAT BELONGS HERE
 *   - fetch calls + JSON (de)serialisation + error surfacing
 *
 * WHAT DOES NOT BELONG HERE
 *   - SQL / persistence (→ server only, `src/lib/db.ts`)
 *   - React state (→ the components that call these)
 * ============================================================================= */

import type { NewScore, Score } from "@/types/score";

/** Fetch the ranked leaderboard (top `limit` rows). Throws on a non-OK response. */
export async function getScores(limit = 20): Promise<Score[]> {
  const res = await fetch(`/api/scores?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status}).`);
  const data = (await res.json()) as { scores: Score[] };
  return data.scores;
}

/** Record a finished run. Returns the stored entry (with its rank). Throws with
 *  the server's message on a validation/other error. */
export async function postScore(entry: NewScore): Promise<Score> {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Failed to save score (${res.status}).`);
  }
  const data = (await res.json()) as { score: Score };
  return data.score;
}
