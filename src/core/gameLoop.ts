/* =============================================================================
 * src/core/gameLoop.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Schedules the per-frame "tick" using requestAnimationFrame and calls
 *   each system in the correct order. This is the heartbeat of the game.
 *
 * WHY IT EXISTS
 *   We want a clear, single place that answers: "what happens every frame
 *   and in which order?". That order matters — e.g. movement must run
 *   before collision so collisions use updated positions.
 *
 *   The loop is intentionally outside React. React re-renders are driven
 *   by the store's subscription; the simulation never waits for React.
 *
 * WHAT BELONGS HERE
 *   - rAF scheduling
 *   - delta-time calculation
 *   - The fixed ORDER of system calls
 *
 * WHAT DOES NOT BELONG HERE
 *   - System logic (each system is in `src/systems/`)
 *   - Three.js scene creation (`src/lib/threeSetup.ts`)
 *   - React effects (the loop is started by a hook, see
 *     `src/hooks/useGameLoop.ts`)
 *
 * --- The rendering pipeline (read this once) ---------------------------------
 *   Frame N:
 *     1. Compute dt (delta-time)
 *     2. dispatch TICK — advances clocks in the store
 *     3. Run simulation systems in order:
 *           spawn → wave → input/shooting → movement → collision → cleanup
 *        Each system reads state, computes changes, dispatches actions.
 *     4. Run renderSystem — copies entity positions onto Three.js meshes
 *        and calls renderer.render(scene, camera).
 * ----------------------------------------------------------------------------- */

import { dispatch, getState } from "./gameStore";
import { spawnSystem } from "@/systems/spawnSystem";
import { waveSystem } from "@/systems/waveSystem";
import { shootingSystem } from "@/systems/shootingSystem";
import { movementSystem } from "@/systems/movementSystem";
import { collisionSystem } from "@/systems/collisionSystem";
import { cleanupSystem } from "@/systems/cleanupSystem";
import { renderSystem, type RenderContext } from "@/systems/renderSystem";

let rafId = 0;
let lastTime = 0;

/**
 * Start the loop. Returns a stop() function.
 *
 * `ctx` carries the Three.js objects needed by `renderSystem` (renderer,
 * scene, camera). They live in `src/lib/threeSetup.ts` and are passed in
 * by `GameCanvas.tsx` — the loop itself stays decoupled from Three.js.
 */
export function startGameLoop(ctx: RenderContext): () => void {
  lastTime = performance.now();

  const frame = (now: number) => {
    const dt = now - lastTime;
    lastTime = now;

    const phase = getState().phase;

    // --- Simulation: skip when paused / not playing -------------------------
    if (phase === "playing") {
      dispatch({ type: "TICK", dt });

      // ORDER MATTERS. Comment lines below to debug a specific system.
      waveSystem(dt);
      spawnSystem(dt);
      shootingSystem(dt);
      movementSystem(dt);
      collisionSystem(dt);
      cleanupSystem(dt);
    }

    // --- Render runs every frame, even when paused, so the scene stays drawn.
    renderSystem(ctx);

    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}
