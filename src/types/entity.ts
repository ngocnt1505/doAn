/* =============================================================================
 * src/types/entity.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Type definitions for every "thing" that lives in the game world: enemies,
 *   bullets, the house, etc. These are PLAIN DATA shapes — no methods, no
 *   behaviour.
 *
 * WHY IT EXISTS
 *   A state-driven architecture treats the world as data. Systems read that
 *   data, decide what to do, and write back. Keeping entities as data (not
 *   classes with methods) means state can be cloned, serialised and tested
 *   without a live Three.js scene.
 *
 * WHAT BELONGS HERE
 *   - Interfaces / unions describing entity shape
 *   - Enums of entity kinds, enemy types, weapon levels
 *
 * WHAT DOES NOT BELONG HERE
 *   - Three.js mesh creation (that's `src/entities/*` factories)
 *   - Behaviour or system logic
 * ============================================================================= */

/** Enemy difficulty classes (SRS FR-8): HP and speed differ per type. */
export type EnemyType = "easy" | "medium" | "hard";

/** Enemy lifecycle (Milestone 5). Deliberately minimal — a tower-defense enemy
 *  only spawns, moves, and dies. No idle/attack/search/alert/combat states. */
export type EnemyState = "spawning" | "moving" | "dead";

/** Weapon progression levels (SRS FR-12..14). Player always starts "basic". */
export type WeaponLevel = "basic" | "medium" | "advanced";

/** A flat position on the battlefield ground plane (x = width, z = depth). */
export interface GroundPos {
  x: number;
  z: number;
}

/** A full 3D world position (plain data — no Three.js, so state stays cloneable). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A monster on the battlefield.
 *  MILESTONE 3: id + difficulty type + position. Health and movement fields are
 *  added in later milestones. */
export interface Enemy {
  id: string;
  type: EnemyType;
  /** Lifecycle state (Milestone 5): spawning → moving → dead. */
  state: EnemyState;
  /** Current health. Reaching 0 destroys the enemy (SRS BR-33). */
  health: number;
  /** Max health for this type (SRS BR-17/19/21); health never exceeds it (BR-32). */
  maxHealth: number;
  /** Ground position (x = width, z = depth). y is always 0 (on the ground). */
  pos: GroundPos;
  /** Lane the enemy smoothly weaves around (its spawn z). */
  baseZ: number;
  /** Per-enemy phase + amplitude of the lateral sine weave, so each one follows a
   *  unique, smooth, non-straight path (SRS BR-27/28/29/30). */
  wanderPhase: number;
  wanderAmp: number;
}

/** The single "X" the player drops by clicking — the chosen target location
 *  (SRS FR-15 step 5/6). Stored in state; the renderer mirrors it to the scene. */
export interface TargetMarker {
  /** Ground position the marker sits on. */
  pos: GroundPos;
}

/** A projectile fired by the weapon. It flies a ballistic arc from the muzzle to
 *  the clicked target over a fixed flight time (Phase 5 · M7/M8). On landing it
 *  applies area-of-effect damage based on `damage` (Phase 6 · combat pipeline). */
export interface Bullet {
  id: string;
  /** Launch point — the weapon muzzle (SRS BR-55). */
  origin: Vec3;
  /** Landing point — the clicked target on the ground (SRS BR-56/60). */
  target: Vec3;
  /** Current world position, updated each frame by the movement system. */
  position: Vec3;
  /** Seconds since launch; the flight completes at `flightTime`. */
  elapsed: number;
  /** Seconds this projectile takes to reach the target — depends on the firing
   *  weapon (SRS BR-61: Basic slow … Advanced fast). */
  flightTime: number;
  /** Weapon damage D delivered at impact — the full amount an enemy at the exact
   *  landing point receives (SRS FR-19 / BR-69). Area-of-effect falloff scales it
   *  down with distance. */
  damage: number;
  /** True if this projectile is a Big Shot (SRS FR-18). Purely cosmetic here —
   *  the renderer draws Big Shots red to set them apart from normal shots. */
  isBigShot: boolean;
}
