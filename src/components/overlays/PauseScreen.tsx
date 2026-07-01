// Pause overlay (status "paused"): offers Resume, Restart and Quit. The reducer
// already freezes the simulation while paused.

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function PauseScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "paused") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <Panel className="mx-4 w-80 max-w-full p-8 text-center">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Paused</h2>
        <div className="flex flex-col gap-3">
          <Button onClick={() => dispatch({ type: "RESUME" })}>Resume</Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "RESTART" })}
          >
            Restart
          </Button>
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
