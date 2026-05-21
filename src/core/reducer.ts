/* =============================================================================
 * src/core/reducer.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A pure function `(state, action) → newState`. This is the ONLY place
 *   game state is allowed to change. Every UI button, every system, every
 *   keystroke ultimately dispatches an action and lands here.
 *
 * WHY IT EXISTS
 *   "State-driven architecture" in one sentence: derive the next state from
 *   the previous state plus a description of what happened. A reducer makes
 *   that derivation explicit and pure, which means:
 *     - Easy to test (no mocks, just call the function)
 *     - Easy to debug (log action + state diff)
 *     - Easy to rewind / replay
 *
 * WHAT BELONGS HERE
 *   - The switch over GameAction
 *   - Small immutable helpers used while constructing the next state
 *
 * WHAT DOES NOT BELONG HERE
 *   - Side effects: no Three.js, no DOM, no setTimeout, no fetch
 *   - System logic that needs to iterate over time (`src/systems/*` and the
 *     game loop drive that; they then dispatch back through this reducer)
 * ============================================================================= */

import type { GameState } from "@/types/game";
import type { GameAction } from "@/types/actions";
import { initialState } from "./state";
import { MAX_DELTA_MS } from "./constants";

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    /* ------------------------------------------------------------------ */
    /* Lifecycle                                                          */
    /* ------------------------------------------------------------------ */
    case "START":
      // Always start from a clean slate so the player can replay cleanly.
      return { ...initialState(), phase: "playing" };

    case "PAUSE":
      return state.phase === "playing" ? { ...state, phase: "paused" } : state;

    case "RESUME":
      return state.phase === "paused" ? { ...state, phase: "playing" } : state;

    case "RESET":
      return initialState();

    case "WIN":
      return { ...state, phase: "won" };

    case "LOSE":
      return { ...state, phase: "lost" };

    /* ------------------------------------------------------------------ */
    /* Tick                                                               */
    /* ------------------------------------------------------------------ */
    case "TICK": {
      // The reducer only advances clocks/counters. The systems do the real
      // simulation work, dispatching their own actions when needed.
      const dt = Math.min(action.dt, MAX_DELTA_MS);
      return {
        ...state,
        tick: state.tick + 1,
        elapsedMs: state.elapsedMs + dt,
      };
    }

    /* ------------------------------------------------------------------ */
    /* Input                                                              */
    /* ------------------------------------------------------------------ */
    case "SET_INPUT":
      return { ...state, input: action.input };

    /* ------------------------------------------------------------------ */
    /* Entities                                                           */
    /* ------------------------------------------------------------------ */
    case "SPAWN":
      return { ...state, entities: [...state.entities, action.entity] };

    case "DESPAWN":
      return {
        ...state,
        entities: state.entities.filter((e) => e.id !== action.id),
      };

    case "REPLACE_ENTITIES":
      // Systems use this to commit batched per-frame changes in one go.
      return { ...state, entities: action.entities };

    /* ------------------------------------------------------------------ */
    /* Score                                                              */
    /* ------------------------------------------------------------------ */
    case "ADD_SCORE":
      return { ...state, score: state.score + action.amount };

    case "SET_WAVE":
      return { ...state, wave: action.wave };

    /* ------------------------------------------------------------------ */
    /* Exhaustiveness check — TS error here means a new action type was
     * added without a case above.                                        */
    /* ------------------------------------------------------------------ */
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
