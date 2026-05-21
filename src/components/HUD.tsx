/* =============================================================================
 * src/components/HUD.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The always-visible read-out: score, wave, and player health. Subscribes
 *   to the store with narrow selectors so it only re-renders when those
 *   slices change.
 *
 * WHY IT EXISTS
 *   The HUD is the reference example of "render from state". It demonstrates
 *   how a UI component participates in the state-driven loop without ever
 *   touching Three.js, the game loop, or the reducer.
 *
 * WHAT BELONGS HERE
 *   - JSX driven by selectors over GameState
 *
 * WHAT DOES NOT BELONG HERE
 *   - Gameplay decisions / dispatching mutating actions (use ControlPanel)
 *   - Three.js
 * ============================================================================= */

"use client";

import { useGameStore } from "@/core/gameStore";
import { formatScore } from "@/lib/helpers";
import { PLAYER_MAX_HEALTH } from "@/core/constants";
import type { PlayerEntity } from "@/types/entity";

export default function HUD() {
  const score = useGameStore((s) => s.score);
  const wave  = useGameStore((s) => s.wave);
  const phase = useGameStore((s) => s.phase);
  const health = useGameStore((s) => {
    const p = s.entities.find((e): e is PlayerEntity => e.kind === "player");
    return p?.health ?? 0;
  });

  // The HUD is only meaningful during play. We hide it on overlay states.
  if (phase === "idle") return null;

  const healthPct = Math.max(0, Math.min(100, (health / PLAYER_MAX_HEALTH) * 100));

  return (
    <div className="hud pointer-events-none absolute left-4 top-4 select-none text-white">
      <div className="text-xs uppercase tracking-widest text-zinc-400">Score</div>
      <div className="text-3xl font-semibold leading-tight">{formatScore(score)}</div>

      <div className="mt-3 text-xs uppercase tracking-widest text-zinc-400">Wave</div>
      <div className="text-xl font-medium">{wave}</div>

      <div className="mt-3 text-xs uppercase tracking-widest text-zinc-400">Health</div>
      <div className="mt-1 h-2 w-40 rounded bg-white/10">
        <div
          className="h-2 rounded bg-emerald-400 transition-[width] duration-150"
          style={{ width: `${healthPct}%` }}
        />
      </div>
    </div>
  );
}
