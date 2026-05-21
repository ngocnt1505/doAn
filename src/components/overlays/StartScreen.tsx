/* =============================================================================
 * src/components/overlays/StartScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The pre-game splash. Visible only when `phase === "idle"`. Offers a
 *   "Start" button that dispatches the START action.
 *
 * WHY IT EXISTS
 *   Overlays are great demonstrations of state-driven UI: each overlay
 *   reads `phase` from the store and decides whether to render. No parent
 *   has to orchestrate them.
 *
 * WHAT BELONGS HERE / NOT
 *   - YES: JSX + the one action this overlay dispatches
 *   - NO: per-frame game logic
 * ============================================================================= */

"use client";

import { dispatch, useGameStore } from "@/core/gameStore";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";

export default function StartScreen() {
  const phase = useGameStore((s) => s.phase);
  if (phase !== "idle") return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <Panel className="w-80 text-center">
        <h2 className="text-2xl font-semibold">Ready?</h2>
        <p className="text-sm text-zinc-300">
          WASD to move, Space to shoot. Survive the waves.
        </p>
        <Button onClick={() => dispatch({ type: "START" })}>Start</Button>
      </Panel>
    </div>
  );
}
