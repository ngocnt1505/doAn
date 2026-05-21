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
import type { Entity } from "@/types/entity";

export function cleanupSystem(dt: number): void {
  const state = getState();
  if (state.entities.length === 0) return;

  let didChange = false;
  const next: Entity[] = [];

  for (const e of state.entities) {
    // Tick down bullet lifetime and mark expired ones dead.
    if (e.kind === "bullet" && !e.dead) {
      const lifetime = e.lifetime - dt;
      if (lifetime <= 0) {
        didChange = true;
        continue; // drop expired bullet
      }
      if (lifetime !== e.lifetime) {
        next.push({ ...e, lifetime });
        didChange = true;
        continue;
      }
    }

    if (e.dead) {
      didChange = true;
      continue; // drop dead entities
    }
    next.push(e);
  }

  if (didChange) dispatch({ type: "REPLACE_ENTITIES", entities: next });

  // TODO: emit "wave:complete" when no enemies remain after a wave started.
  // TODO: check player health to dispatch LOSE.
}
