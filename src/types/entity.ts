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

/** Weapon progression levels (SRS FR-12..14). Player always starts "basic". */
export type WeaponLevel = "basic" | "medium" | "advanced";

/** A flat position on the battlefield ground plane (x = width, z = depth). */
export interface GroundPos {
  x: number;
  z: number;
}

/** A monster on the battlefield.
 *  MILESTONE 1: position only. `type`, health and movement fields are added in
 *  later milestones — for now we just need to place one on the map. */
export interface Enemy {
  id: string;
  /** Ground position (x = width, z = depth). y is always 0 (on the ground). */
  pos: GroundPos;
}

/** A projectile travelling along a ballistic arc to a clicked target. */
export interface Bullet {
  id: string;
  origin: GroundPos;
  target: GroundPos;
  /** 0 → 1 progress along the arc; impact resolves at 1 (SRS FR-37). */
  t: number;
  damage: number;
}
