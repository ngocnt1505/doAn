/* =============================================================================
 * src/types/game.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The shape of the whole game world: every piece of information the systems
 *   need to compute the next frame. This is the single source of truth that the
 *   store holds.
 *
 * WHY IT EXISTS
 *   In a state-driven architecture, "the game" IS this object. Defining it as a
 *   TypeScript interface makes the contract explicit: reducers must produce a
 *   valid GameState, systems receive and return a GameState, the HUD reads one.
 *
 * WHAT BELONGS HERE
 *   - Top-level state interface
 *   - Lifecycle/status enum
 *
 * WHAT DOES NOT BELONG HERE
 *   - Action types → `actions.ts`
 *   - Entity shapes → `entity.ts`
 *   - The initial-state factory → `src/core/state.ts`
 * ============================================================================= */

import type { Bullet, Enemy, WeaponLevel } from "./entity";

/** Lifecycle of the game (SRS State Diagram). Overlays render from this value. */
export type GameStatus =
  | "idle" // Welcome screen. Nothing is simulated (SRS BR-1/BR-2).
  | "countdown" // 3 → 2 → 1 → Ready before the first spawn (SRS FR-3).
  | "playing" // Active simulation. Systems run every frame.
  | "paused" // Frozen. Systems skip update; render keeps drawing (SRS FR-26).
  | "win" // Wave 3 cleared (SRS FR-31).
  | "lose"; // An enemy reached the house (SRS FR-29).

/** The whole world, in one object. The reducer returns a new copy of this. */
export interface GameState {
  status: GameStatus;

  /** Current wave, 1..3 (SRS FR-21). */
  wave: number;
  /** Active weapon; starts "basic" (SRS BR-6/BR-91). */
  weapon: WeaponLevel;

  /** Player score, derived from kills but stored for HUD reads. */
  score: number;
  /** Seconds elapsed in the Playing state (SRS FR-31). */
  elapsed: number;
  /** Countdown value shown before the first spawn (SRS FR-3). */
  countdown: number;

  /** The protected house; defeat occurs when an enemy reaches it. */
  player: { hp: number };

  /** All living monsters. Order is not meaningful. */
  enemies: Enemy[];
  /** All in-flight projectiles. */
  bullets: Bullet[];
}
