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
import { DEFENSE_LINE_X, SPAWN_X } from "@/core/constants";

/** The enemies' goal: the house front (left side, -x). */
export const GOAL_X = DEFENSE_LINE_X;

/** Full distance from the spawn line to the house (used to convert time→speed). */
const TRAVEL_DISTANCE = SPAWN_X - GOAL_X;

/** Seconds to cross the field, per type (SRS FR-8). This is TRAVEL TIME — speed
 *  is derived from it below. */
const TRAVEL_TIME: Record<EnemyType, number> = {
  easy: 12,
  medium: 15,
  hard: 18,
};

/** How fast an enemy eases sideways toward its random target lane (per second).
 *  Small, so the lateral drift is gentle (SRS BR-28/29). */
const WANDER_Z_RATE = 0.6;

/** Constant advance speed (world units/second) toward the house, by type. */
export function speedFor(type: EnemyType): number {
  return TRAVEL_DISTANCE / TRAVEL_TIME[type];
}

/** Advance every enemy toward the house by `dt` seconds, clamped at the goal so
 *  they stop at the house front rather than walking off the map. Each enemy also
 *  eases sideways toward its random `targetZ`, so the group doesn't move in one
 *  perfectly straight line (SRS BR-27/28/29/30). Returns a new array (enemies
 *  that didn't move keep their identity). */
export function moveEnemies(enemies: Enemy[], dt: number): Enemy[] {
  return enemies.map((enemy) => {
    if (enemy.state !== "moving") return enemy; // only MOVING enemies advance
    const x = Math.max(enemy.pos.x - speedFor(enemy.type) * dt, GOAL_X);
    // Ease toward the (randomly offset) target lane — gentle, not a hard turn.
    const z = enemy.pos.z + (enemy.targetZ - enemy.pos.z) * Math.min(1, WANDER_Z_RATE * dt);
    if (x === enemy.pos.x && z === enemy.pos.z) return enemy; // nothing changed
    return { ...enemy, pos: { x, z } };
  });
}
