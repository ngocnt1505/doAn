/* =============================================================================
 * src/systems/movementSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Advance every entity's position by its velocity over the current frame.
 *   `position += velocity * dt`.
 *
 * WHY IT EXISTS
 *   Movement is the simplest possible system and the right place to learn
 *   the systems pattern:
 *     1. Read state from the store
 *     2. Compute the new entity list (don't mutate, return a copy)
 *     3. Dispatch a single action that commits the change
 *
 * WHAT BELONGS HERE
 *   - Position integration
 *   - Optional steering for enemies (basic AI nudging velocity)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Collision response (`collisionSystem.ts`)
 *   - Spawning / despawning
 *   - Three.js mesh updates (`renderSystem.ts`)
 *
 * NOTE
 *   `dt` is in MILLISECONDS. Multiply by 0.001 to apply to per-second speeds.
 * ============================================================================= */

import { dispatch, getState } from "@/core/gameStore";
import { addV3, scaleV3 } from "@/lib/math";
import type { Entity } from "@/types/entity";

export function movementSystem(dt: number): void {
  const { entities } = getState();
  const dtSec = dt * 0.001;

  const next: Entity[] = entities.map((e) => {
    // Skip entities with no velocity to avoid useless allocations.
    if (e.velocity[0] === 0 && e.velocity[1] === 0 && e.velocity[2] === 0) {
      return e;
    }
    return {
      ...e,
      position: addV3(e.position, scaleV3(e.velocity, dtSec)),
    };
  });

  dispatch({ type: "REPLACE_ENTITIES", entities: next });

  // TODO: clamp positions to the world bounds (see WORLD_HALF_SIZE).
  // TODO: enemies should steer toward the player — that AI nudge belongs here.
}
