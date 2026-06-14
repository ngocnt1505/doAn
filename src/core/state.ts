/* =============================================================================
 * src/core/state.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Defines the INITIAL game state and small constructors that produce
 *   "blank" entities (e.g. a fresh player). It is the single starting point
 *   that the reducer falls back to on RESET.
 *
 * WHY IT EXISTS
 *   Splitting "shape of state" (in `src/types/game.ts`) from "what state
 *   starts as" (here) keeps types reusable and lets us reset the world by
 *   simply replacing the store with `initialState()`.
 *
 * WHAT BELONGS HERE
 *   - Factory functions producing fresh, valid state
 *   - Default entity constructors
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer (action → new state) → `reducer.ts`
 *   - System logic
 *   - Three.js objects
 * ============================================================================= */

import type { GameState, InputState } from "@/types/game";
import { createPlayerEntity } from "@/entities/Player";

/** Empty input snapshot — used as the default until a hook overwrites it. */
export const emptyInput = (): InputState => ({
  forward: false,
  back: false,
  left: false,
  right: false,
  shoot: false,
});

/** The state every game starts from. The reducer returns this on RESET. */
export const initialState = (): GameState => ({
  phase: "idle",
  tick: 0,
  elapsedMs: 0,
  score: 0,
  wave: 0,
  entities: [createPlayerEntity()],
  input: emptyInput(),
});
