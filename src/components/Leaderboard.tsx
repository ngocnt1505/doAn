/* =============================================================================
 * src/components/Leaderboard.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Fetches and renders the ranked leaderboard from `GET /api/scores`. Handles the
 *   three async UI states explicitly — loading, error, empty — and highlights the
 *   player's just-submitted row (`highlightId`). Re-fetches whenever `highlightId`
 *   changes, so a freshly recorded run shows up immediately on the end screens.
 * ============================================================================= */

"use client";

import { useEffect, useState } from "react";
import type { Score } from "@/types/score";
import { getScores } from "@/lib/scoresApi";

/** Milliseconds → "m:ss.t" (e.g. 72000 → "1:12.0"). */
function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

/** A run's outcome as a short label: cleared the game, or the wave it died on. */
function resultLabel(score: Score): string {
  return score.won ? "✓ Cleared" : `Wave ${score.waveReached}`;
}

interface LeaderboardProps {
  /** Row id to highlight (the player's own freshly-submitted run). Changing this
   *  also triggers a re-fetch so a new entry appears right away. */
  highlightId?: number | null;
  /** Max rows to show. */
  limit?: number;
  className?: string;
}

export default function Leaderboard({
  highlightId = null,
  limit = 20,
  className = "",
}: LeaderboardProps) {
  const [scores, setScores] = useState<Score[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScores(null);
    setError(null);
    getScores(limit)
      .then((rows) => {
        if (!cancelled) setScores(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, [limit, highlightId]);

  if (error) {
    return (
      <p className={`text-sm text-red-300 ${className}`}>
        Couldn&apos;t load the leaderboard. {error}
      </p>
    );
  }

  if (scores === null) {
    return <p className={`text-sm text-zinc-400 ${className}`}>Loading leaderboard…</p>;
  }

  if (scores.length === 0) {
    return (
      <p className={`text-sm text-zinc-400 ${className}`}>
        No scores yet — be the first to make the board!
      </p>
    );
  }

  return (
    <div className={className}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-zinc-400">
            <th className="px-2 py-1 font-medium">#</th>
            <th className="px-2 py-1 font-medium">Name</th>
            <th className="px-2 py-1 font-medium">Result</th>
            <th className="px-2 py-1 text-right font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => {
            const isMine = score.id === highlightId;
            return (
              <tr
                key={score.id}
                className={`border-t border-white/10 ${
                  isMine ? "bg-emerald-400/20 font-semibold text-emerald-200" : "text-zinc-200"
                }`}
              >
                <td className="px-2 py-1.5 tabular-nums">{score.rank}</td>
                <td className="px-2 py-1.5">
                  {score.name}
                  {isMine ? " (you)" : ""}
                </td>
                <td className="px-2 py-1.5">{resultLabel(score)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatTime(score.timeMs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
