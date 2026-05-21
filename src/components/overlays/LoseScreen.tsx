/* =============================================================================
 * src/components/overlays/LoseScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Show the lose screen when `phase === "lost"`.
 *
 * WHY IT EXISTS / WHAT BELONGS — see StartScreen.tsx.
 * ============================================================================= */

"use client";

import { dispatch, useGameStore } from "@/core/gameStore";
import { formatScore } from "@/lib/helpers";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";

export default function LoseScreen() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  if (phase !== "lost") return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-red-900/40">
      <Panel className="w-80 text-center">
        <h2 className="text-2xl font-semibold">Game over</h2>
        <p className="text-sm text-zinc-300">Score: {formatScore(score)}</p>
        <Button onClick={() => dispatch({ type: "RESET" })}>Try again</Button>
      </Panel>
    </div>
  );
}
