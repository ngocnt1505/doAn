/* =============================================================================
 * src/types/actions.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The closed set of "things that can happen" to game state. Every state
 *   change goes through one of these actions and the reducer in
 *   `src/core/reducer.ts`.
 *
 * WHY IT EXISTS
 *   Limiting state changes to a known vocabulary is the core idea of
 *   reducers (Redux, useReducer, etc.). It makes debugging trivial —
 *   you can log every action and replay it.
 *
 *   This file defines the vocabulary. Anything not in here cannot
 *   legally modify state.
 *
 * WHAT BELONGS HERE
 *   - Discriminated union of action shapes
 *   - Small helper "action creator" types if useful
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer itself → `src/core/reducer.ts`
 *   - Event-bus messages used between systems → `src/core/eventBus.ts`
 * ============================================================================= */

import type { Entity } from "./entity";
import type { InputState } from "./game";

/* ---------- Lifecycle actions ---------- */
interface StartAction      { type: "START"; }
interface PauseAction      { type: "PAUSE"; }
interface ResumeAction     { type: "RESUME"; }
interface ResetAction      { type: "RESET"; }
interface WinAction        { type: "WIN"; }
interface LoseAction       { type: "LOSE"; }

/* ---------- Tick-level actions ---------- */
/** Advances time by `dt` (delta-time in ms). Emitted every animation frame. */
interface TickAction       { type: "TICK"; dt: number; }

/* ---------- Input ---------- */
/** Replaces the current input snapshot. Emitted by input hooks. */
interface SetInputAction   { type: "SET_INPUT"; input: InputState; }

/* ---------- Entity mutations ---------- */
interface SpawnAction      { type: "SPAWN"; entity: Entity; }
interface DespawnAction    { type: "DESPAWN"; id: string; }
interface ReplaceEntitiesAction {
  type: "REPLACE_ENTITIES";
  entities: Entity[];
}

/* ---------- Score & wave ---------- */
interface AddScoreAction   { type: "ADD_SCORE"; amount: number; }
interface SetWaveAction    { type: "SET_WAVE"; wave: number; }

/* ---------- The union ---------- */
/** Exhaustive union of all legal actions. TypeScript will warn if the
 * reducer forgets one of these. */
export type GameAction =
  | StartAction
  | PauseAction
  | ResumeAction
  | ResetAction
  | WinAction
  | LoseAction
  | TickAction
  | SetInputAction
  | SpawnAction
  | DespawnAction
  | ReplaceEntitiesAction
  | AddScoreAction
  | SetWaveAction;
