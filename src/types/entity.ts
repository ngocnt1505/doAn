// Type definitions for every "thing" that lives in the game world. Plain-data
// shapes — no methods, no behaviour — so state can be cloned and tested.

// Enemy difficulty classes: HP and speed differ per type.
export type EnemyType = "easy" | "medium" | "hard";

// Enemy lifecycle: spawning → moving → dead.
export type EnemyState = "spawning" | "moving" | "dead";

// Weapon progression levels. Player always starts "basic".
export type WeaponLevel = "basic" | "medium" | "advanced";

// A flat position on the battlefield ground plane (x = width, z = depth).
export interface GroundPos {
  x: number;
  z: number;
}

// A full 3D world position (plain data — no Three.js).
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// A monster on the battlefield.
export interface Enemy {
  id: string;
  type: EnemyType;
  state: EnemyState;
  health: number;
  maxHealth: number;
  pos: GroundPos;
  // Lane the enemy smoothly weaves around (its spawn z).
  baseZ: number;
  // Per-enemy phase + amplitude of the lateral sine weave.
  wanderPhase: number;
  wanderAmp: number;
}

// The single "X" the player drops by clicking — the chosen target location.
export interface TargetMarker {
  pos: GroundPos;
}

// A projectile fired by the weapon. Flies a ballistic arc from the muzzle to the
// target over `flightTime`, then applies area-of-effect damage from `damage`.
export interface Bullet {
  id: string;
  origin: Vec3;
  target: Vec3;
  position: Vec3;
  elapsed: number;
  flightTime: number;
  damage: number;
  // True for a Big Shot (cosmetic here: the renderer draws it red).
  isBigShot: boolean;
}
