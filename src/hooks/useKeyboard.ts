/* =============================================================================
 * src/hooks/useKeyboard.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Capture lifecycle-level keyboard shortcuts. In the current MVP the player
 *   aims and fires entirely with the mouse (see `useMouse.ts`), so the
 *   keyboard is reserved for things the mouse cannot easily express:
 *
 *     ESC   →  toggle pause / resume
 *
 * WHY IT EXISTS
 *   Systems should NOT poll the DOM. Lifecycle shortcuts go through the
 *   reducer the same as any other action. Per-frame gameplay input has moved
 *   to `useMouse` for this build.
 *
 * WHAT BELONGS HERE
 *   - Shortcut → dispatch mapping for lifecycle actions
 *
 * WHAT DOES NOT BELONG HERE
 *   - Mouse / pointer events (`useMouse.ts`)
 *   - Gameplay reactions to input — those happen in systems
 * ============================================================================= */

import { useEffect } from "react";
import { dispatch, getState } from "@/core/gameStore";

export function useKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      const phase = getState().phase;
      if (phase === "playing") dispatch({ type: "PAUSE" });
      else if (phase === "paused") dispatch({ type: "RESUME" });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
