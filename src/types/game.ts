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

import type { Bullet, Enemy, TargetMarker, WeaponLevel } from "./entity";

/** Lifecycle of the game (SRS State Diagram). Overlays render from this value. */
export type GameStatus =
  | "idle" // Welcome screen. Nothing is simulated (SRS BR-1/BR-2).
  | "countdown" // 3 → 2 → 1 → Ready before the first spawn (SRS FR-3).
  | "playing" // Active simulation. Systems run every frame.
  | "paused" // Frozen. Systems skip update; render keeps drawing (SRS FR-26).
  | "reward" // Wave cleared: weapon-unlock overlay, awaiting Use now / Continue.
  | "transition" // 3s "Wave N" message before the next wave spawns (SRS FR-24).
  | "win" // Wave 3 cleared (SRS FR-31).
  | "lose"; // An enemy reached the house (SRS FR-29).

/** The whole world, in one object. The reducer returns a new copy of this. */
export interface GameState {
  status: GameStatus;

  /** Current wave, 1..3 (SRS FR-21). */
  wave: number;
  /** Active weapon; starts "basic" (SRS BR-6/BR-91). */
  weapon: WeaponLevel;
  /** Weapons the player has unlocked so far; starts just ["basic"]. The HUD
   *  picker only lets the player switch to weapons in this list (SRS FR-25). */
  weaponsUnlocked: WeaponLevel[];
  /** Normal attacks fired since the last Big Shot, for the CURRENT weapon. Resets
   *  to 0 when the weapon changes or a Big Shot fires (SRS FR-18 / BR-62/63). */
  attackCount: number;
  /** Seconds left until the weapon can fire again — the reload timer (SRS FR-16 /
   *  BR-130..132). 0 means ready; firing sets it to the weapon's reload time. */
  weaponCooldown: number;

  /** Seconds elapsed in the Playing state (SRS FR-31). */
  elapsed: number;
  /** Countdown value shown before the first spawn (SRS FR-3). */
  countdown: number;
  /** Seconds left in the between-wave transition message (SRS FR-24 / BR-89). */
  waveTransition: number;

  /** The protected house; defeat occurs when an enemy reaches it. */
  player: { hp: number };

  /** All living monsters. Order is not meaningful. */
  enemies: Enemy[];
  /** All in-flight projectiles. */
  bullets: Bullet[];

  /** The current "X" target the player last clicked, or null if none yet
   *  (SRS FR-15). The renderer mirrors it to the scene. */
  marker: TargetMarker | null;
}
