/* =============================================================================
 * src/systems/cleanupSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Remove entities that have left play. Milestone 6: drop destroyed enemies
 *   (state === "dead") so they stop participating in updates (SRS BR-127/BR-129).
 *
 *   NOTE: removal is immediate for now (no death animation). When a death
 *   animation is added, hold the "dead" enemy until the clip finishes before
 *   removing it.
 * ============================================================================= */

import type { Enemy } from "@/types/entity";

/** Keep only living enemies (drop the destroyed ones). */
export function removeDead(enemies: Enemy[]): Enemy[] {
  return enemies.filter((enemy) => enemy.state !== "dead");
}
