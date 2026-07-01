// In-game runtime control: while playing, offers Pause. Resume and Restart live
// on the Pause overlay. The button just dispatches an action.

"use client";

import Button from "@/components/ui/Button";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function ControlPanel() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "playing") return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 flex gap-2">
      <Button variant="secondary" onClick={() => dispatch({ type: "PAUSE" })}>
        Pause
      </Button>
    </div>
  );
}
