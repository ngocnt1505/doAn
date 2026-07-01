// The shape of the whole game world: every piece of information the systems need
// to compute the next frame. The single source of truth the store holds.

import type { Bullet, Enemy, TargetMarker, WeaponLevel } from "./entity";

// Lifecycle of the game. Overlays render from this value.
export type GameStatus =
  | "idle"
  | "countdown"
  | "playing"
  | "paused"
  | "reward"
  | "transition"
  | "win"
  | "lose";

// The whole world, in one object. The reducer returns a new copy of this.
export interface GameState {
  status: GameStatus;

  // Current wave, 1..3.
  wave: number;
  // Active weapon; starts "basic".
  weapon: WeaponLevel;
  // Weapons unlocked so far; the HUD picker only offers these.
  weaponsUnlocked: WeaponLevel[];
  // Normal attacks fired since the last Big Shot, for the current weapon.
  attackCount: number;
  // Seconds left until the weapon can fire again (0 = ready).
  weaponCooldown: number;

  // Seconds elapsed in the Playing state.
  elapsed: number;
  // Countdown value shown before the first spawn.
  countdown: number;
  // Seconds left in the between-wave transition message.
  waveTransition: number;

  // Grace countdown once a wave's field is clear, before advancing; null when no
  // clear is pending. Kept in state so the reducer owns the wave-completion
  // and victory decision.
  waveClearTimer: number | null;
  // Enemies of the current wave created so far (resets each wave).
  spawnedThisWave: number;

  // The protected house; defeat occurs when an enemy reaches it.
  player: { hp: number };

  // All living monsters and in-flight projectiles.
  enemies: Enemy[];
  bullets: Bullet[];

  // The current "X" target the player last clicked, or null if none yet.
  marker: TargetMarker | null;

  // Name entered on the start screen, or null if anonymous ("Pass").
  playerName: string | null;
}
