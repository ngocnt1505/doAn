/* =============================================================================
 * src/core/reducer.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The pure state-transition function: (state, action) → state. No side
 *   effects, no Three.js, no DOM. This is the ONLY place GameState changes.
 *
 * WHY IT EXISTS
 *   A single reducer keeps the data flow predictable (SRS State Architecture):
 *   UI and systems dispatch actions, the reducer decides the next world.
 *
 * WHAT BELONGS HERE
 *   - One `switch` over the action union
 *   - Pure, deterministic transitions returning new state
 *
 * WHAT DOES NOT BELONG HERE
 *   - rAF / timers (→ `gameLoop.ts`)
 *   - Rendering, asset loading, input listening
 * ============================================================================= */

import type { GameAction } from "@/types/actions";
import type { GameState } from "@/types/game";
import { initialState } from "@/core/state";

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      // Begin a brand-new session from the welcome screen (SRS FR-2).
      return { ...initialState(), status: "countdown" };

    case "BEGIN_PLAY":
      if (state.status !== "countdown") return state;
      return { ...state, status: "playing" };

    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused" };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "playing" };

    case "WIN":
      return { ...state, status: "win" };

    case "LOSE":
      return { ...state, status: "lose" };

    case "RESTART":
      // Fresh state, straight back into the countdown (SRS FR-28).
      return { ...initialState(), status: "countdown" };

    case "RETURN_TO_MENU":
      return initialState();

    case "TICK": {
      // Time only advances during the countdown and active play.
      if (state.status === "countdown") {
        const countdown = state.countdown - action.dt;
        // When the countdown elapses, the machine flips itself to Playing
        // (SRS FR-3) — no external trigger needed.
        if (countdown <= 0) return { ...state, countdown: 0, status: "playing" };
        return { ...state, countdown };
      }
      if (state.status === "playing") {
        return { ...state, elapsed: state.elapsed + action.dt };
      }
      return state;
    }

    default:
      return state;
  }
}
