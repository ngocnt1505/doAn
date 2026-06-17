/* =============================================================================
 * src/core/state.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Defines the INITIAL game state — the single "blank world" the reducer falls
 *   back to on START_GAME / RESTART / RETURN_TO_MENU.
 *
 * WHY IT EXISTS
 *   Splitting "shape of state" (`src/types/game.ts`) from "what state starts as"
 *   (here) keeps the type reusable and lets us reset the world by simply
 *   replacing the store contents with `initialState()` (SRS BR-4/BR-103).
 *
 * WHAT BELONGS HERE
 *   - Factory functions producing fresh, valid state
 *   - Default entity constructors
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer (action → new state) → `reducer.ts`
 *   - System logic / Three.js objects
 * ============================================================================= */

import type { GameState } from "@/types/game";
import { COUNTDOWN_SECONDS, HOUSE_MAX_HP } from "@/core/constants";

/** The state every game starts from (SRS FR-2 Data Initialization). */
export const initialState = (): GameState => ({
  status: "idle",
  wave: 1,
  weapon: "basic",
  score: 0,
  elapsed: 0,
  countdown: COUNTDOWN_SECONDS,
  player: { hp: HOUSE_MAX_HP },
  enemies: [],
  bullets: [],
});
