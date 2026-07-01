// The browser-side client for the leaderboard API: thin typed wrappers around
// fetch so components just await getScores() / postScore(...).

import type { NewScore, Score } from "@/types/score";

// Fetch the ranked leaderboard (top `limit` rows). Throws on a non-OK response.
export async function getScores(limit = 20): Promise<Score[]> {
  const res = await fetch(`/api/scores?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status}).`);
  const data = (await res.json()) as { scores: Score[] };
  return data.scores;
}

// Record a finished run. Returns the stored entry (with its rank).
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
