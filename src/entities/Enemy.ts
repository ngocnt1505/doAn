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

/** Amplitude range (world units) of the lateral sine weave. Each enemy gets a
 *  random value in [min, max] so they don't all swing the same width. */
const WANDER_AMP_MIN = 2.5;
const WANDER_AMP_MAX = 6;

let nextId = 0;

/** Create one enemy of `type` at a ground position. Starts SPAWNING with full
 *  health; the state machine flips it to MOVING on the next update. Gets a random
 *  weave phase + amplitude so it follows a smooth, non-straight path. */
export function createEnemy(type: EnemyType, pos: GroundPos): Enemy {
  const maxHealth = ENEMY_HP[type];
  return {
    id: `enemy-${nextId++}`,
    type,
    state: "spawning",
    health: maxHealth,
    maxHealth,
    pos,
    baseZ: pos.z,
    wanderPhase: Math.random() * Math.PI * 2,
    wanderAmp: WANDER_AMP_MIN + Math.random() * (WANDER_AMP_MAX - WANDER_AMP_MIN),
  };
}
