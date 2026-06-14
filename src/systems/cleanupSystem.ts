/* =============================================================================
 * src/systems/cleanupSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Remove entities that are flagged `dead`, plus despawn bullets whose
 *   lifetime has elapsed.
 *
 * WHY IT EXISTS
 *   Death and despawn are simple but cross-cutting concerns. Centralising
 *   them in one system at the END of the frame guarantees other systems
 *   see a consistent world while they run.
 *
 * WHAT BELONGS HERE
 *   - Filtering out dead entities
 *   - Bullet lifetime ticking
 *   - Win/lose condition checks (small enough to keep here for now)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Three.js mesh disposal — the render system reconciles meshes with
 *     state, including removing meshes whose entity has gone away
 *   - Decisions about WHY something died (collision did that)
 * ============================================================================= */

import { dispatch, getState } from "@/core/gameStore";
import { emit } from "@/core/eventBus";
import type { Entity } from "@/types/entity";

export function cleanupSystem(dt: number): void {
  const state = getState();
  if (state.entities.length === 0) return;

  let didChange = false;
  const next: Entity[] = [];

  for (const e of state.entities) {
    if (e.kind === "bullet" && !e.dead) {
      // Ground impact — the bullet has finished its arc. Emit an event so
      // visual/audio fx can react, then drop it.
      if (e.position[1] <= 0) {
        emit("bullet:landed", {
          bulletId: e.id,
          at: [e.position[0], 0, e.position[2]],
        });
        didChange = true;
        continue;
      }

      // Safety-net lifetime — should never trigger before ground impact
      // under normal gravity, but keeps us safe if something extreme happens.
      const lifetime = e.lifetime - dt;
      if (lifetime <= 0) {
        didChange = true;
        continue;
      }
      if (lifetime !== e.lifetime) {
        next.push({ ...e, lifetime });
        didChange = true;
        continue;
      }
    }

    // Enemy in its death animation: tick the timer; when it hits zero the
    // corpse is removed from the world.
    if (e.kind === "enemy" && e.dyingMs !== undefined) {
      const remaining = e.dyingMs - dt;
      if (remaining <= 0) {
        didChange = true;
        continue;
      }
      next.push({ ...e, dyingMs: remaining });
      didChange = true;
      continue;
    }

    if (e.dead) {
      didChange = true;
      continue;
    }
    next.push(e);
  }

  if (didChange) dispatch({ type: "REPLACE_ENTITIES", entities: next });
}
