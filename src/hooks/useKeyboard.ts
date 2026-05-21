/* =============================================================================
 * src/hooks/useKeyboard.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Listen to keyboard events at the window level, translate them into an
 *   `InputState` snapshot, and push that snapshot into the store via the
 *   SET_INPUT action.
 *
 * WHY IT EXISTS
 *   Systems should NOT poll the DOM. They read `state.input`, which is the
 *   contract this hook fulfils. That separation lets us replace the input
 *   source (gamepad, touch, replay file) without changing any system.
 *
 * WHAT BELONGS HERE
 *   - Key → action mapping (WASD, Space, etc.)
 *   - Throttling SET_INPUT dispatches (only on change)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Gameplay reactions to input — those happen in systems
 *   - UI button behaviour — handled by their own onClick handlers
 * ============================================================================= */

import { useEffect } from "react";
import { dispatch } from "@/core/gameStore";
import type { InputState } from "@/types/game";

const emptyInput = (): InputState => ({
  forward: false,
  back: false,
  left: false,
  right: false,
  shoot: false,
});

export function useKeyboard(): void {
  useEffect(() => {
    const input = emptyInput();

    const update = (e: KeyboardEvent, pressed: boolean) => {
      let changed = false;
      switch (e.code) {
        case "KeyW": case "ArrowUp":    if (input.forward !== pressed) { input.forward = pressed; changed = true; } break;
        case "KeyS": case "ArrowDown":  if (input.back !== pressed)    { input.back = pressed;    changed = true; } break;
        case "KeyA": case "ArrowLeft":  if (input.left !== pressed)    { input.left = pressed;    changed = true; } break;
        case "KeyD": case "ArrowRight": if (input.right !== pressed)   { input.right = pressed;   changed = true; } break;
        case "Space":                   if (input.shoot !== pressed)   { input.shoot = pressed;   changed = true; } break;
      }
      if (changed) dispatch({ type: "SET_INPUT", input: { ...input } });
    };

    const onDown = (e: KeyboardEvent) => update(e, true);
    const onUp   = (e: KeyboardEvent) => update(e, false);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);
}
