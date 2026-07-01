// A minimal requestAnimationFrame driver. Each frame it computes the clamped
// delta-time and hands it to a single `frame` callback.

import { MAX_DELTA } from "@/core/constants";

export interface GameLoop {
  start: () => void;
  stop: () => void;
}

export function createGameLoop(frame: (dt: number) => void): GameLoop {
  let rafId = 0;
  let last = 0;
  let running = false;

  // One frame: measure clamped dt, run the callback, schedule the next.
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
