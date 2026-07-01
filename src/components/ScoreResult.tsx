// The end-screen leaderboard block shared by the Win and Lose overlays. Reflects
// the current run's submission state and highlights the player's new row.

"use client";

import Leaderboard from "@/components/Leaderboard";
import { useScoreSubmission } from "@/hooks/useSubmitScore";

export default function ScoreResult() {
  const submission = useScoreSubmission();

  const highlightId = submission.phase === "done" ? submission.score.id : null;

  return (
    <div className="mt-2 text-left">
      {submission.phase === "submitting" && (
        <p className="mb-2 text-center text-sm text-zinc-300">Saving your score…</p>
      )}
      {submission.phase === "done" && (
        <p className="mb-2 text-center text-sm text-emerald-300">
          Saved — you&apos;re rank #{submission.score.rank}!
        </p>
      )}
      {submission.phase === "error" && (
        <p className="mb-2 text-center text-sm text-red-300">{submission.message}</p>
      )}
      {submission.phase === "skipped" && (
        <p className="mb-2 text-center text-sm text-zinc-400">
          Anonymous run — not recorded. Enter a name on the start screen to make the board.
        </p>
      )}

      <p className="mb-1 px-2 text-[10px] uppercase tracking-widest text-zinc-400">
        Leaderboard
      </p>
      <Leaderboard highlightId={highlightId} className="max-h-64 overflow-y-auto" />
    </div>
  );
}
