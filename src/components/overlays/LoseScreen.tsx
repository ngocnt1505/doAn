// Defeat overlay (status "lose"): an enemy reached the house. Shows the
// leaderboard and offers Restart or Quit.

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import ScoreResult from "@/components/ScoreResult";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function LoseScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "lose") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <Panel className="mx-4 w-[28rem] max-w-full p-8 text-center">
        <h2 className="mb-2 text-3xl font-semibold tracking-tight text-red-300">
          Defeat
        </h2>
        <p className="mb-4 text-zinc-300">
          A monster broke through and reached the house. Try again?
        </p>
        <ScoreResult />
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => dispatch({ type: "RESTART" })}>Restart</Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "RETURN_TO_MENU" })}
          >
            Quit
          </Button>
        </div>
      </Panel>
    </div>
  );
}
