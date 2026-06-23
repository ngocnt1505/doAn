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
  weaponsUnlocked: ["basic"], // only the Basic weapon at the start (SRS BR-91)
  attackCount: 0,
  weaponCooldown: 0, // ready to fire immediately
  elapsed: 0,
  countdown: COUNTDOWN_SECONDS,
  waveTransition: 0,
  player: { hp: HOUSE_MAX_HP },
  // Enemies are created by the spawn system (Milestone 3), not seeded here.
  enemies: [],
  bullets: [],
  // No target chosen until the player clicks the ground (SRS FR-15).
  marker: null,
  // Set on START_GAME from the start-screen name prompt; null = anonymous.
  playerName: null,
});
