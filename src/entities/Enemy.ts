/* =============================================================================
 * src/entities/Enemy.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for enemy entities (plain data, no Three.js, no class).
 *
 * MILESTONE 6
 *   id + type + lifecycle state + health + ground position. Health starts full
 *   at the per-type maximum (SRS BR-17/19/21).
 * ============================================================================= */

import type { Enemy, EnemyType, GroundPos } from "@/types/entity";

/** Maximum (and starting) health per type — SRS BR-17 / BR-19 / BR-21. */
const ENEMY_HP: Record<EnemyType, number> = {
  easy: 100,
  medium: 200,
  hard: 400,
};

/** Max lateral offset (world units) applied to an enemy's target lane, so paths
 *  aren't perfectly straight/parallel (SRS BR-28 "small random offset"). */
const WANDER_OFFSET = 2;

let nextId = 0;

/** Create one enemy of `type` at a ground position. Starts SPAWNING with full
 *  health; the state machine flips it to MOVING on the next update. Picks a
 *  random target lane (spawn z ± WANDER_OFFSET) for non-straight movement. */
export function createEnemy(type: EnemyType, pos: GroundPos): Enemy {
  const maxHealth = ENEMY_HP[type];
  return {
    id: `enemy-${nextId++}`,
    type,
    state: "spawning",
    health: maxHealth,
    maxHealth,
    pos,
    // random(-WANDER_OFFSET, +WANDER_OFFSET) added to the spawn lane
    targetZ: pos.z + (Math.random() * 2 - 1) * WANDER_OFFSET,
  };
}
