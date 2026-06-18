/* =============================================================================
 * src/components/overlays/StartScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Welcome overlay (SRS FR-1). Shown while status is "idle": title, a short
 *   objective description, and a Start Game button that dispatches START_GAME
 *   (idle → countdown). No gameplay runs behind it (BR-1/BR-2) because no
 *   systems execute outside the Playing state.
 * ============================================================================= */

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

export default function StartScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();

  if (status !== "idle") return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <Panel className="mx-4 max-w-lg p-10 text-center">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">
          3D House Defense
        </h1>
        <p className="mb-8 text-zinc-300">
          Defend the house at the center of the battlefield against three waves
          of incoming monsters. Click the ground to fire your cannon, lead your
          shots, and unlock stronger weapons after every wave.
        </p>
        <Button onClick={() => dispatch({ type: "START_GAME" })}>
          Start Game
        </Button>
      </Panel>
    </div>
  );
}
