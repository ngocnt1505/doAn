/* =============================================================================
 * src/hooks/useGameLoop.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   React-side wrapper that starts the game loop when a component mounts
 *   and stops it when the component unmounts.
 *
 * WHY IT EXISTS
 *   The game loop (`src/core/gameLoop.ts`) is intentionally framework
 *   agnostic. This hook is the small adapter that ties it into React's
 *   mount/unmount lifecycle — and only this hook needs to know about both
 *   sides.
 *
 * WHAT BELONGS HERE
 *   - `useEffect` that starts and stops the loop
 *
 * WHAT DOES NOT BELONG HERE
 *   - The loop itself (`src/core/gameLoop.ts`)
 *   - Per-frame logic
 * ============================================================================= */

import { useEffect } from "react";
import { startGameLoop } from "@/core/gameLoop";
import type { RenderContext } from "@/systems/renderSystem";

export function useGameLoop(ctx: RenderContext | null): void {
  useEffect(() => {
    if (!ctx) return;
    const stop = startGameLoop(ctx);
    return () => stop();
  }, [ctx]);
}
