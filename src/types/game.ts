/* =============================================================================
 * src/types/game.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The shape of the whole game world: every piece of information the
 *   systems need to compute the next frame. This is the single source of
 *   truth that the store holds.
 *
 * WHY IT EXISTS
 *   In a state-driven architecture, "the game" IS this object. Anything not
 *   in here is either ephemeral (key presses), derived (score from kills),
 *   or rendering-only (Three.js meshes that mirror entities).
 *
 *   Defining it as a TypeScript interface makes the contract explicit:
 *     - Reducers must produce a valid GameState
 *     - Systems receive and return a GameState
 *     - The HUD reads from a GameState
 *
 * WHAT BELONGS HERE
 *   - Top-level state interface
 *   - Lifecycle/phase enum
 *   - Input snapshot type (so systems don't poll the DOM)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Action types → `actions.ts`
 *   - Entity shapes → `entity.ts`
 *   - Anything tied to a rendering library
 * ============================================================================= */

import type { Entity } from "./entity";

/** Lifecycle of the game. Overlays render based on this value. */
export type GamePhase =
  | "idle"      // Pre-start screen. Nothing is being simulated.
  | "playing"  // Active simulation. Systems run every frame.
  | "paused"   // Frozen. Systems skip update; render keeps drawing.
  | "won"      // Win condition met. Sim stops, win overlay shows.
  | "lost";    // Lose condition met. Sim stops, lose overlay shows.

/** Snapshot of input for one frame. Filled by `useKeyboard` etc. */
export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
}

/** The whole world, in one object. Reducers return a new copy of this. */
export interface GameState {
  phase: GamePhase;

  /** Monotonically increasing frame counter — useful for systems & debug. */
  tick: number;
  /** ms since the simulation started. Drives waves, cooldowns, animations. */
  elapsedMs: number;

  /** Player score; derived from enemy kills. Kept in state for HUD reads. */
  score: number;
  /** Current wave number (1-indexed). Drives the spawn system difficulty. */
  wave: number;

  /** All living things in the world. Order is not meaningful. */
  entities: Entity[];

  /** Latest input snapshot. Reducers/systems read from this. */
  input: InputState;
}
