/* =============================================================================
 * src/systems/movementSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Move every enemy toward the house (Milestone 4). Enemies spawn at the right
 *   edge (+x) and advance left toward the house front (-x).
 *
 * TRAVEL TIME, NOT SPEED
 *   Each type is defined by how long it takes to cross the WHOLE field, not by a
 *   raw speed. We derive the speed once from the distance:
 *       speed = TRAVEL_DISTANCE / travelTime   (units/second)
 *   so easy (8s) is fastest, hard (15s) slowest, regardless of field size.
 * ============================================================================= */

import type { Enemy, EnemyType } from "@/types/entity";
import { DEFENSE_LINE_X, SPAWN_X, YARD_HALF_DEPTH } from "@/core/constants";

/** The enemies' goal: the house front (left side, -x). */
export const GOAL_X = DEFENSE_LINE_X;

/** Full distance from the spawn line to the house (used to convert time→speed). */
const TRAVEL_DISTANCE = SPAWN_X - GOAL_X;

/** Seconds to cross the field, per type (SRS FR-8). This is TRAVEL TIME — speed
 *  is derived from it below. */
const TRAVEL_TIME: Record<EnemyType, number> = {
  easy: 25,
  medium: 30,
  hard: 35,
};

/** How many full side-to-side weaves an enemy makes crossing the whole field.
 *  Higher = tighter, more frequent S-curves; lower = long lazy sweeps. */
const WANDER_CYCLES = 2.4;
/** Keep the weave (and so the enemies) clear of the fence at the depth edges. */
const WANDER_MARGIN = 3;

/** Constant advance speed (world units/second) toward the house, by type. */
export function speedFor(type: EnemyType): number {
  return TRAVEL_DISTANCE / TRAVEL_TIME[type];
}

/** Advance every enemy toward the house by `dt` seconds, clamped at the goal so
 *  they stop at the house front rather than walking off the map. Lateral position
 *  is a smooth sine weave around the enemy's lane, driven by how far it has
 *  travelled — so each enemy follows a continuous, natural, non-straight path with
 *  its own width and phase (SRS BR-27/28/29/30). Returns a new array. */
export function moveEnemies(enemies: Enemy[], dt: number): Enemy[] {
  const half = YARD_HALF_DEPTH - WANDER_MARGIN;
  return enemies.map((enemy) => {
    if (enemy.state !== "moving") return enemy; // only MOVING enemies advance

    const x = Math.max(enemy.pos.x - speedFor(enemy.type) * dt, GOAL_X);
    // Progress 0 (spawn) → 1 (house); the sine completes WANDER_CYCLES swings.
    const progress = (SPAWN_X - x) / TRAVEL_DISTANCE;
    const weave =
      enemy.wanderAmp *
      Math.sin(enemy.wanderPhase + progress * Math.PI * 2 * WANDER_CYCLES);
    const z = Math.max(-half, Math.min(half, enemy.baseZ + weave));
    return { ...enemy, pos: { x, z } };
  });
}
