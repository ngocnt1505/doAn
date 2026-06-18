/* =============================================================================
 * src/systems/enemyState.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The enemy state machine (Milestone 5). Three states only:
 *
 *       SPAWNING ──(next update)──▶ MOVING ──(killed)──▶ DEAD
 *
 *   - SPAWNING: just created; not moving yet.
 *   - MOVING:   advancing toward the house (the movement system only moves
 *               enemies in this state).
 *   - DEAD:     terminal; set when the enemy is killed (health/collision — a
 *               later milestone) and then removed by a cleanup step.
 *
 *   This file owns ONLY the transitions. Movement lives in `movementSystem.ts`.
 * ============================================================================= */

import type { Enemy } from "@/types/entity";

/** Run the automatic transitions one step. The only automatic edge is
 *  SPAWNING → MOVING (BR-25: a spawned enemy immediately enters the Move state).
 *  MOVING → DEAD is triggered explicitly when an enemy is killed, not here. */
export function advanceEnemyStates(enemies: Enemy[]): Enemy[] {
  return enemies.map((enemy) =>
    enemy.state === "spawning" ? { ...enemy, state: "moving" } : enemy,
  );
}
