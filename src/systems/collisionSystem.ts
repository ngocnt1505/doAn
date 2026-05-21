/* =============================================================================
 * src/systems/collisionSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Detect when bullets touch enemies, apply damage, mark dead entities,
 *   and update the score.
 *
 * WHY IT EXISTS
 *   Collision is where rendering ("bodies touching") meets simulation
 *   ("apply damage"). Isolating it as its own system means we can swap the
 *   detection strategy (AABB, sphere, spatial grid, broadphase) without
 *   touching anything else.
 *
 * WHAT BELONGS HERE
 *   - Pairwise tests between bullets ↔ enemies (and later: enemies ↔ player)
 *   - Damage application, score updates, death flags
 *
 * WHAT DOES NOT BELONG HERE
 *   - Despawn / removal — `cleanupSystem.ts` handles dead entities next frame
 *   - Visual effects — emit events instead
 * ============================================================================= */

import { dispatch, getState } from "@/core/gameStore";
import { emit } from "@/core/eventBus";
import { ENEMY_SCORE_VALUE } from "@/core/constants";
import { distanceSqV3 } from "@/lib/math";
import type { Entity } from "@/types/entity";

/** Squared hit radius — using squared distance avoids a sqrt per pair. */
const HIT_RADIUS_SQ = 0.6 * 0.6;

export function collisionSystem(_dt: number): void {
  const state = getState();

  // Snapshot working copies so we mutate locally and commit once at the end.
  const next: Entity[] = state.entities.map((e) => ({ ...e }));
  let scoreDelta = 0;

  for (const bullet of next) {
    if (bullet.kind !== "bullet" || bullet.dead) continue;

    for (const enemy of next) {
      if (enemy.kind !== "enemy" || enemy.dead) continue;
      if (distanceSqV3(bullet.position, enemy.position) > HIT_RADIUS_SQ) continue;

      // Hit! Mark both dead — actual removal happens in cleanupSystem.
      bullet.dead = true;
      enemy.dead = true;
      scoreDelta += ENEMY_SCORE_VALUE;

      emit("bullet:hit", { bulletId: bullet.id, targetId: enemy.id });
      emit("enemy:killed", { enemyId: enemy.id, byOwnerId: bullet.ownerId });

      break; // one bullet, one kill
    }
  }

  dispatch({ type: "REPLACE_ENTITIES", entities: next });
  if (scoreDelta > 0) dispatch({ type: "ADD_SCORE", amount: scoreDelta });

  // TODO: enemy ↔ player and enemy ↔ house collisions.
  // TODO: replace O(n*m) with a spatial grid when entity counts get large.
}
