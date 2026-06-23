/* =============================================================================
 * src/types/actions.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The closed set of "things that can happen" to game state. Every state change
 *   goes through one of these actions and the reducer in `src/core/reducer.ts`.
 *
 * WHY IT EXISTS
 *   Limiting state changes to a known vocabulary is the core idea of reducers
 *   (Redux, useReducer…). It makes debugging trivial — you can log every action
 *   and replay it. Anything not in this union cannot legally modify state.
 *
 * WHAT BELONGS HERE
 *   - Discriminated union of action shapes
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer itself → `src/core/reducer.ts`
 *   - Transient inter-system notifications → `src/core/eventBus.ts`
 * ============================================================================= */

import type { Enemy, GroundPos, WeaponLevel } from "./entity";

/* ---------- Lifecycle actions (SRS State Diagram) ---------- */
/** idle → countdown. Optional `name` is the leaderboard name from the start
 *  screen; omitted / undefined means the player chose "Pass" (anonymous). */
interface StartGameAction { type: "START_GAME"; name?: string; } // idle → countdown
interface PauseAction { type: "PAUSE"; } // playing → paused
interface ResumeAction { type: "RESUME"; } // paused → playing
interface WinAction { type: "WIN"; } // playing → win
interface LoseAction { type: "LOSE"; } // playing → lose
interface RestartAction { type: "RESTART"; } // any → countdown (fresh)
interface ReturnToMenuAction { type: "RETURN_TO_MENU"; } // any → idle (fresh)

/* ---------- Tick-level actions ---------- */
/** Advances time by `dt` (seconds). Dispatched once per animation frame. */
interface TickAction { type: "TICK"; dt: number; }

/* ---------- Enemy actions (Milestone 3 spawn system) ---------- */
/** Append a fully-built enemy to the world. */
interface SpawnEnemyAction { type: "SPAWN_ENEMY"; enemy: Enemy; }
/** Remove an enemy by id. */
interface RemoveEnemyAction { type: "REMOVE_ENEMY"; id: string; }

/* ---------- Enemy actions (Milestone 4 movement) ---------- */
/** Advance all enemies toward the house by `dt` seconds. */
interface MoveEnemiesAction { type: "MOVE_ENEMIES"; dt: number; }

/* ---------- Enemy actions (Milestone 6 health) ---------- */
/** Deal `amount` damage to one enemy (SRS FR-11). */
interface DamageEnemyAction { type: "DAMAGE_ENEMY"; id: string; amount: number; }

/* ---------- Shooting actions (Phase 5) ---------- */
/** Clear the target marker — e.g. the moment a bullet reaches it (M9). */
interface ClearTargetAction { type: "CLEAR_TARGET"; }
/** Fire the current weapon at a target: builds the projectile(s) for the active
 *  weapon, advances the Big Shot counter, and drops the marker (Phase 7). */
interface FireShotAction { type: "FIRE_SHOT"; target: GroundPos; }
/** Advance all bullets along their arc by `dt` seconds (M7/M8). */
interface MoveBulletsAction { type: "MOVE_BULLETS"; dt: number; }

/* ---------- Wave / weapon progression (Phase 7) ---------- */
/** The current wave's enemies are all spawned and destroyed; a non-final wave is
 *  cleared. Unlocks the next weapon and opens the reward overlay (SRS FR-23/25). */
interface WaveClearedAction { type: "WAVE_CLEARED"; }
/** Player answered the reward overlay: `useNew` switches to the just-unlocked
 *  weapon, otherwise the current one is kept. Starts the wave transition. */
interface ResolveRewardAction { type: "RESOLVE_REWARD"; useNew: boolean; }
/** Player picked a weapon from the HUD picker (must be unlocked, SRS FR-25). */
interface SelectWeaponAction { type: "SELECT_WEAPON"; weapon: WeaponLevel; }

/* ---------- The union ---------- */
/** Exhaustive union of all legal actions. TypeScript warns if the reducer
 *  forgets one. Gameplay actions (SPAWN, FIRE, APPLY_DAMAGE…) arrive later. */
export type GameAction =
  | StartGameAction
  | PauseAction
  | ResumeAction
  | WinAction
  | LoseAction
  | RestartAction
  | ReturnToMenuAction
  | TickAction
  | SpawnEnemyAction
  | RemoveEnemyAction
  | MoveEnemiesAction
  | DamageEnemyAction
  | ClearTargetAction
  | FireShotAction
  | MoveBulletsAction
  | WaveClearedAction
  | ResolveRewardAction
  | SelectWeaponAction;
