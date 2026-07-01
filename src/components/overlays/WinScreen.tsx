// Victory overlay (status "win"): shows the leaderboard and a button back to the
// welcome screen.

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import ScoreResult from "@/components/ScoreResult";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function WinScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "win") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <Panel className="mx-4 w-[28rem] max-w-full p-8 text-center">
        <h2 className="mb-2 text-3xl font-semibold tracking-tight text-emerald-300">
          Victory!
        </h2>
        <p className="mb-4 text-zinc-300">
          You defended the house through all three waves.
        </p>
        <ScoreResult />
        <Button
          className="mt-6"
          onClick={() => dispatch({ type: "RETURN_TO_MENU" })}
        >
          Return to Start Page
        </Button>
      </Panel>
    </div>
  );
}
