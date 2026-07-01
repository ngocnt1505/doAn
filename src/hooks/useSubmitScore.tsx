// Records a finished run on the leaderboard. The moment the game reaches "win" or
// "lose", this submits the run via the API — once per run — and exposes the
// outcome so the end screens can show progress and highlight the player's new row.
// Network side effects live here, not in the pure reducer.

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGameState } from "@/hooks/useGameStore";
import { postScore } from "@/lib/scoresApi";
import type { Score } from "@/types/score";

// Lifecycle of the score submission for the current run.
export type SubmitState =
  | { phase: "idle" }
  | { phase: "skipped" }
  | { phase: "submitting" }
  | { phase: "done"; score: Score }
  | { phase: "error"; message: string };

const ScoreSubmissionContext = createContext<SubmitState>({ phase: "idle" });

const RECENT_SUBMISSION_TTL_MS = 30_000;
// Guards against a duplicate submit for an identical run within the TTL.
const recentSubmissions = new Map<
  string,
  { expiresAt: number; promise: Promise<Score> }
>();

function submissionKey(entry: {
  name: string;
  timeMs: number;
  waveReached: number;
  won: boolean;
}): string {
  return [
    entry.name.trim().toLowerCase(),
    entry.timeMs,
    entry.waveReached,
    entry.won ? "1" : "0",
  ].join("|");
}

function rememberSubmission(key: string, promise: Promise<Score>) {
  const expiresAt = Date.now() + RECENT_SUBMISSION_TTL_MS;
  recentSubmissions.set(key, { expiresAt, promise });
  window.setTimeout(() => {
    if (recentSubmissions.get(key)?.expiresAt === expiresAt) {
      recentSubmissions.delete(key);
    }
  }, RECENT_SUBMISSION_TTL_MS);
}

export function ScoreSubmissionProvider({ children }: { children: ReactNode }) {
  const state = useGameState();
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });

  // Latest game values, read inside the effect without being dependencies.
  const latest = useRef(state);
  latest.current = state;

  // True once we've handled the current run's end, so we never submit twice.
  const handled = useRef(false);

  useEffect(() => {
    const { status } = state;

    // Not an end state → fresh / in-progress run; re-arm the guard.
    if (status !== "win" && status !== "lose") {
      handled.current = false;
      setSubmit({ phase: "idle" });
      return;
    }

    if (handled.current) return;
    handled.current = true;

    const { playerName, elapsed, wave } = latest.current;
    if (!playerName) {
      setSubmit({ phase: "skipped" }); // anonymous run — nothing to record
      return;
    }

    const entry = {
      name: playerName,
      timeMs: Math.round(elapsed * 1000),
      waveReached: wave,
      won: status === "win",
    };
    const key = submissionKey(entry);
    const recent = recentSubmissions.get(key);
    const promise =
      recent && recent.expiresAt > Date.now()
        ? recent.promise
        : postScore(entry);
    if (!recent || recent.expiresAt <= Date.now()) rememberSubmission(key, promise);

    setSubmit({ phase: "submitting" });
    let cancelled = false;
    promise
      .then((score) => {
        if (!cancelled) setSubmit({ phase: "done", score });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSubmit({
            phase: "error",
            message: err instanceof Error ? err.message : "Could not save your score.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // Only the status transition should drive this; other values are read via ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <ScoreSubmissionContext.Provider value={submit}>
      {children}
    </ScoreSubmissionContext.Provider>
  );
}

// Read the current run's submission state (for the end screens).
export function useScoreSubmission(): SubmitState {
  return useContext(ScoreSubmissionContext);
}
