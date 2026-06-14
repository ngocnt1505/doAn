/* =============================================================================
 * src/types/entity.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Type definitions for every "thing" that lives in the game world: players,
 *   enemies, bullets, props, etc. These are PLAIN DATA shapes — no methods,
 *   no behaviour.
 *
 * WHY IT EXISTS
 *   A state-driven architecture treats the world as data. Systems read that
 *   data, decide what to do, and write back. Keeping entities as data (not
 *   classes with methods) means:
 *     - State can be serialised, cloned, time-travelled, debugged
 *     - Systems stay pure functions of (state, dt) → newState
 *     - Tests don't need a full Three.js scene to verify game rules
 *
 * WHAT BELONGS HERE
 *   - Interfaces / types describing entity shape
 *   - Enums or unions of entity kinds
 *
 * WHAT DOES NOT BELONG HERE
 *   - Three.js mesh creation (that's `src/entities/*` factories)
 *   - Behaviour or system logic
 *   - React-specific types
 * ============================================================================= */

/** A 3D vector represented as a plain tuple. Cheap to clone & serialise. */
export type Vec3 = readonly [x: number, y: number, z: number];

/** Discriminator for entity unions. Add new kinds here as the game grows. */
export type EntityKind = "player" | "enemy" | "bullet" | "house";

/** Fields shared by every entity. Keep this list small — only universal stuff. */
export interface BaseEntity {
  readonly id: string;
  readonly kind: EntityKind;
  position: Vec3;
  velocity: Vec3;
  /** Marked true by systems; the cleanup system removes these next frame. */
  dead: boolean;
}

export interface PlayerEntity extends BaseEntity {
  readonly kind: "player";
  health: number;
  /** Last time (ms) the player fired — used by the shooting system cooldown. */
  lastShotAt: number;
  /** World-space point the cannon barrel is currently aiming at. `null` means
   *  the barrel is in its rest pose (looking straight down-yard). The render
   *  system reads this each frame to orient the barrel pivot. */
  aimTarget: Vec3 | null;
}

/** The flavor of monster. Drives stats AND visual mesh. Keep the list short —
 *  every new variant needs a mesh factory and a stats block. */
export type EnemyVariant = "grunt" | "brute" | "stalker";

export interface EnemyEntity extends BaseEntity {
  readonly kind: "enemy";
  readonly variant: EnemyVariant;
  health: number;
  /** Higher number = faster enemy. Used by the movement system. */
  speed: number;
  /** Per-enemy phase offset (0..2π) for the sine-wave wander applied by the
   *  movement system. Set once at spawn so each monster weaves differently. */
  readonly wanderPhase: number;
  /** Milliseconds remaining in the death animation. While > 0 the enemy is
   *  visually dying (sinking + toppling) but still on the entity list so the
   *  render system can finish the animation. `undefined` = alive. */
  dyingMs?: number;
}

export interface BulletEntity extends BaseEntity {
  readonly kind: "bullet";
  /** Who fired it — used to avoid friendly-fire / self-hits. */
  ownerId: string;
  /** ms remaining before the bullet despawns. */
  lifetime: number;
}

export interface HouseEntity extends BaseEntity {
  readonly kind: "house";
  health: number;
}

/** Discriminated union — narrow with `entity.kind === "enemy"` etc. */
export type Entity = PlayerEntity | EnemyEntity | BulletEntity | HouseEntity;
