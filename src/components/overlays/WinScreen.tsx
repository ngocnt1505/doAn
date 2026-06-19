/* =============================================================================
 * src/components/overlays/WinScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Victory overlay (SRS FR-32/FR-33). Shown while status is "win". Offers
 *   "Return to Start Page", which dispatches RETURN_TO_MENU (→ idle), clearing
 *   all gameplay data and bringing back the Welcome Screen for a new session.
 * ============================================================================= */

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function WinScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "win") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <Panel className="mx-4 w-96 max-w-full p-10 text-center">
        <h2 className="mb-2 text-3xl font-semibold tracking-tight text-emerald-300">
          Victory!
        </h2>
        <p className="mb-8 text-zinc-300">
          You defended the house through all three waves.
        </p>
        <Button onClick={() => dispatch({ type: "RETURN_TO_MENU" })}>
          Return to Start Page
        </Button>
      </Panel>
    </div>
  );
}
