/* =============================================================================
 * src/components/ControlPanel.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   In-game runtime control (SRS Runtime Control System, FR-26). While playing,
 *   it offers Pause (playing → paused). Resume and Restart live on the Pause
 *   overlay, so the in-corner panel stays minimal. The button just dispatches an
 *   action — the reducer is the single place state changes.
 * ============================================================================= */

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
