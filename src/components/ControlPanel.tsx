/* =============================================================================
 * src/components/ControlPanel.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A small floating panel for designer/debug controls during play: pause,
 *   reset, future sliders for difficulty, etc.
 *
 * WHY IT EXISTS
 *   Splits "things the player sees" (HUD) from "things the developer or
 *   designer tweaks" (this panel). Keeping it separate keeps the HUD clean.
 *
 * WHAT BELONGS HERE
 *   - Buttons / sliders that dispatch actions
 *
 * WHAT DOES NOT BELONG HERE
 *   - Per-frame display logic (use HUD)
 *   - Three.js
 * ============================================================================= */

"use client";

import { dispatch, useGameStore } from "@/core/gameStore";
import Panel from "./ui/Panel";
import Button from "./ui/Button";

export default function ControlPanel() {
  const phase = useGameStore((s) => s.phase);

  // Only meaningful during active play / pause.
  if (phase !== "playing" && phase !== "paused") return null;

  return (
    <Panel className="absolute right-4 top-4 w-48">
      <div className="text-xs uppercase tracking-widest text-zinc-400">Controls</div>

      {phase === "playing" ? (
        <Button onClick={() => dispatch({ type: "PAUSE" })}>Pause</Button>
      ) : (
        <Button onClick={() => dispatch({ type: "RESUME" })}>Resume</Button>
      )}

      <Button variant="ghost" onClick={() => dispatch({ type: "RESET" })}>
        Reset
      </Button>

      {/* TODO: difficulty slider, debug toggles, fps overlay. */}
    </Panel>
  );
}
