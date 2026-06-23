/* =============================================================================
 * src/core/weapons.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The per-weapon tuning table (SRS FR-12/FR-13/FR-14 + FR-18). One spec per
 *   weapon level: normal damage, the Big Shot interval + damage, projectile
 *   travel time (slow → fast) and projectile count. The shooting reducer and the
 *   weapon renderer both read from here so the numbers live in exactly one place.
 *
 * WHAT BELONGS HERE
 *   - Immutable weapon stats and the progression order / unlock rules
 *
 * WHAT DOES NOT BELONG HERE
 *   - Runtime weapon state (active weapon, attack counter) → game state
 *   - Three.js cannon models → renderSystem / models manifest
 * ============================================================================= */

import type { WeaponLevel } from "@/types/entity";

/** Tuning for one weapon level. */
export interface WeaponSpec {
  /** Human-readable name shown in the HUD / overlays. */
  label: string;
  /** Normal-shot damage D delivered at the blast centre (SRS BR-35/40/46). */
  damage: number;
  /** A Big Shot is fired after this many NORMAL attacks (SRS BR-36/41/47). */
  bigShotEvery: number;
  /** Big Shot damage (SRS BR-37/42/48). */
  bigShotDamage: number;
  /** Seconds a projectile takes to reach the target — Basic slow … Advanced fast
   *  (SRS FR-17 travel-speed table). */
  flightTime: number;
  /** Projectiles fired per attack; Advanced fires two (SRS BR-45/57). */
  projectiles: number;
  /** Reload time (seconds): the weapon can't fire again until this elapses after
   *  a shot (SRS FR-16 / BR-130..132). More powerful weapons reload slower. */
  reloadTime: number;
  /** Wave that must be COMPLETED to unlock this weapon (0 = available at start,
   *  SRS BR-91/92/93). */
  unlockAfterWave: number;
  /** Yaw (radians) applied to the cannon model so its barrel faces the yard (+x,
   *  where monsters come from). Each GLB is authored with a different default
   *  facing, so this is per-weapon. If a cannon points the wrong way, nudge this
   *  by ±Math.PI / 2 (quarter turn) or Math.PI (half turn). */
  rotationY: number;
}

/** Per-weapon stats (SRS FR-12..14 / FR-18). */
export const WEAPONS: Record<WeaponLevel, WeaponSpec> = {
  basic: {
    label: "Basic",
    damage: 80,
    bigShotEvery: 3,
    bigShotDamage: 100,
    flightTime: 1.3, // slowest
    projectiles: 1,
    reloadTime: 2,
    unlockAfterWave: 0,
    rotationY: -Math.PI / 2, // faces the yard (+x) correctly
  },
  medium: {
    label: "Medium",
    damage: 100,
    bigShotEvery: 4,
    bigShotDamage: 120,
    flightTime: 1.0,
    projectiles: 1,
    reloadTime: 2,
    unlockAfterWave: 1, // after Wave 1 (SRS BR-92)
    // GLB faces +z (the player) at -π/2; +π/2 more turns the barrel to +x (yard).
    rotationY: 0,
  },
  advanced: {
    label: "Advanced",
    damage: 150,
    bigShotEvery: 5,
    bigShotDamage: 170,
    flightTime: 0.7, // fastest
    projectiles: 2, // two projectiles per attack (SRS BR-45)
    reloadTime: 3,
    unlockAfterWave: 2, // after Wave 2 (SRS BR-93)
    // GLB faces -x (the house) at -π/2; a half turn (π) brings the barrel to +x.
    rotationY: Math.PI / 2,
  },
};

/** Progression order — index doubles as "unlocked after clearing wave N".
 *  Clearing Wave 1 unlocks WEAPON_ORDER[1] (medium); Wave 2 → [2] (advanced). */
export const WEAPON_ORDER: WeaponLevel[] = ["basic", "medium", "advanced"];

/** Seconds the "X" projectiles of an Advanced attack are spread apart in depth,
 *  so the two shots don't perfectly overlap. */
export const TWIN_SHOT_SPREAD = 1.5;
