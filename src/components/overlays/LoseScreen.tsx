/* =============================================================================
 * src/components/overlays/LoseScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Defeat overlay (SRS FR-30 defeat). Shown while status is "lose" — i.e. an
 *   enemy reached the house. Offers a Restart button that dispatches RESTART
 *   (fresh session at Wave 1 with the Basic weapon, FR-28/BR-101..103).
 * ============================================================================= */

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function LoseScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "lose") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <Panel className="mx-4 w-96 max-w-full p-10 text-center">
        <h2 className="mb-2 text-3xl font-semibold tracking-tight text-red-300">
          Defeat
        </h2>
        <p className="mb-8 text-zinc-300">
          A monster broke through and reached the house. Try again?
        </p>
        <Button onClick={() => dispatch({ type: "RESTART" })}>Restart</Button>
      </Panel>
    </div>
  );
}
