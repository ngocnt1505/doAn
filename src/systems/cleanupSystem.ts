/* =============================================================================
 * src/systems/cleanupSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Remove entities that have left play so they no longer take part in updates or
 *   rendering (SRS FR-39 / BR-127/128/129). The Phase 6 combat pipeline produces
 *   two kinds of spent entity, each cleaned on its own path:
 *
 *     • Expired bullets — dropped in `moveBullets` once they pass
 *       BULLET_REMOVE_TIME (flight + linger), so a landed bullet vanishes ~1 s
 *       after impact.
 *     • Destroyed enemies — marked "dead" by the reducer at 0 HP. The renderer
 *       holds the corpse while it plays the fall animation, then dispatches
 *       REMOVE_ENEMY to purge it from state. A "dead" enemy is already inert
 *       before that: movement only advances "moving" enemies and `resolveImpact`
 *       skips the dead (BR-73), so it stops participating immediately.
 *
 *   `removeDead` below is the INSTANT-removal helper — it drops dead enemies in
 *   one step with no animation. Kept for tests and for resets/teardown where the
 *   fall clip isn't wanted; the live game uses the renderer-driven path above.
 * ============================================================================= */

import type { Enemy } from "@/types/entity";

/** Keep only living enemies (drop the destroyed ones) — instant cleanup with no
 *  death animation (SRS BR-127/BR-129). */
export function removeDead(enemies: Enemy[]): Enemy[] {
  return enemies.filter((enemy) => enemy.state !== "dead");
}
