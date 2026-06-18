/* =============================================================================
 * src/components/overlays/PauseScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Pause overlay (SRS FR-26/FR-27). Shown while status is "paused". Offers
 *   Resume (paused → playing, FR-27) and Restart (fresh session, FR-28). The
 *   simulation is already frozen by the reducer — TICK is a no-op outside
 *   countdown/playing — so the timer and entities hold their state (BR-96/97).
 * ============================================================================= */

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
