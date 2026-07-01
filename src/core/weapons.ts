// The per-weapon tuning table. One spec per weapon level: damage, Big Shot
// interval + damage, projectile travel time and count, reload, unlock.

import type { WeaponLevel } from "@/types/entity";

// Tuning for one weapon level.
export interface WeaponSpec {
  label: string;
  damage: number;
  bigShotEvery: number;
  bigShotDamage: number;
  flightTime: number;
  projectiles: number;
  reloadTime: number;
  unlockAfterWave: number;
  rotationY: number;
}

// Per-weapon stats.
export const WEAPONS: Record<WeaponLevel, WeaponSpec> = {
  basic: {
    label: "Basic",
    damage: 80,
    bigShotEvery: 3,
    bigShotDamage: 100,
    flightTime: 1.3,
    projectiles: 1,
    reloadTime: 2,
    unlockAfterWave: 0,
    rotationY: -Math.PI / 2,
  },
  medium: {
    label: "Medium",
    damage: 100,
    bigShotEvery: 4,
    bigShotDamage: 120,
    flightTime: 1.0,
    projectiles: 1,
    reloadTime: 2,
    unlockAfterWave: 1,
    rotationY: 0,
  },
  advanced: {
    label: "Advanced",
    damage: 150,
    bigShotEvery: 5,
    bigShotDamage: 170,
    flightTime: 0.7,
    projectiles: 2,
    reloadTime: 3,
    unlockAfterWave: 2,
    rotationY: Math.PI / 2,
  },
};

// Progression order — index doubles as "unlocked after clearing wave N".
export const WEAPON_ORDER: WeaponLevel[] = ["basic", "medium", "advanced"];

// Depth spread between the two projectiles of an Advanced attack.
export const TWIN_SHOT_SPREAD = 1.5;
