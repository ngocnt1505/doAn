// Move every enemy toward the house. Enemies spawn at the right edge (+x) and
// advance left toward the house front (-x). Each class is defined by how long it
// takes to cross the whole field; speed is derived from that.

import type { Enemy, EnemyType } from "@/types/entity";
import { DEFENSE_LINE_X, SPAWN_X, YARD_HALF_DEPTH } from "@/core/constants";

// The enemies' goal: the house front (left side, -x).
export const GOAL_X = DEFENSE_LINE_X;

// Full distance from the spawn line to the house.
const TRAVEL_DISTANCE = SPAWN_X - GOAL_X;

// Seconds to cross the field, per type. Speed is derived from this below.
const TRAVEL_TIME: Record<EnemyType, number> = {
  easy: 25,
  medium: 30,
  hard: 35,
};

// How many full side-to-side weaves an enemy makes crossing the whole field.
const WANDER_CYCLES = 2.4;
// Keep the weave clear of the fence at the depth edges.
const WANDER_MARGIN = 3;

// Constant advance speed (world units/second) toward the house, by type.
export function speedFor(type: EnemyType): number {
  return TRAVEL_DISTANCE / TRAVEL_TIME[type];
}

// Advance every MOVING enemy by `dt`, clamped at the goal. Lateral position is a
// smooth sine weave around the enemy's lane. Returns a new array.
export function moveEnemies(enemies: Enemy[], dt: number): Enemy[] {
  const half = YARD_HALF_DEPTH - WANDER_MARGIN;
  return enemies.map((enemy) => {
    if (enemy.state !== "moving") return enemy;

    const x = Math.max(enemy.pos.x - speedFor(enemy.type) * dt, GOAL_X);
    const progress = (SPAWN_X - x) / TRAVEL_DISTANCE;
    const weave =
      enemy.wanderAmp *
      Math.sin(enemy.wanderPhase + progress * Math.PI * 2 * WANDER_CYCLES);
    const z = Math.max(-half, Math.min(half, enemy.baseZ + weave));
    return { ...enemy, pos: { x, z } };
  });
}
