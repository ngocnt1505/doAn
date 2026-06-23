/* =============================================================================
 * src/components/ScoreResult.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The end-screen leaderboard block shared by the Win and Lose overlays. It
 *   reflects the current run's submission state (saving / saved / error / skipped)
 *   and renders the ranked board with the player's new row highlighted.
 * ============================================================================= */

"use client";

import Leaderboard from "@/components/Leaderboard";
import { useScoreSubmission } from "@/hooks/useSubmitScore";

export default function ScoreResult() {
  const submission = useScoreSubmission();

  // The highlighted row + status message depend on where the submission is.
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
      {/* `highlightId` doubles as a re-fetch trigger, so a just-saved run appears. */}
      <Leaderboard highlightId={highlightId} className="max-h-64 overflow-y-auto" />
    </div>
  );
}
