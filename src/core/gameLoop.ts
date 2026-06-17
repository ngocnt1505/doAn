/* =============================================================================
 * src/core/gameLoop.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A minimal requestAnimationFrame driver. Each frame it computes the elapsed
 *   delta-time (seconds, clamped) and hands it to a single `frame` callback.
 *   The caller decides what to do with dt — dispatch TICK, run systems, render.
 *
 * WHY IT EXISTS
 *   Separating "when to step" (here) from "what a step does" (the callback)
 *   keeps this file pure plumbing and lets the React bridge own the wiring:
 *     Input → Dispatch → Reducer → Update State → Run Systems → Render Scene
 *
 * WHAT BELONGS HERE
 *   - rAF scheduling, dt computation, start/stop
 *
 * WHAT DOES NOT BELONG HERE
 *   - Reducer logic, systems, rendering (all live behind the callback)
 * ============================================================================= */

import { MAX_DELTA } from "@/core/constants";

export interface GameLoop {
  start: () => void;
  stop: () => void;
}

export function createGameLoop(frame: (dt: number) => void): GameLoop {
  let rafId = 0;
  let last = 0;
  let running = false;

  const tick = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, MAX_DELTA);
    last = now;
    frame(dt);
    rafId = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
