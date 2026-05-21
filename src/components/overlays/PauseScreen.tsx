/* =============================================================================
 * src/components/overlays/PauseScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Dim the screen and offer Resume / Reset when `phase === "paused"`.
 *
 * WHY IT EXISTS / WHAT BELONGS — see StartScreen.tsx.
 * ============================================================================= */

"use client";

import { dispatch, useGameStore } from "@/core/gameStore";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";

export default function PauseScreen() {
  const phase = useGameStore((s) => s.phase);
  if (phase !== "paused") return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <Panel className="w-80 text-center">
        <h2 className="text-2xl font-semibold">Paused</h2>
        <Button onClick={() => dispatch({ type: "RESUME" })}>Resume</Button>
        <Button variant="ghost" onClick={() => dispatch({ type: "RESET" })}>
          Reset
        </Button>
      </Panel>
    </div>
  );
}
