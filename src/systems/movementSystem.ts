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
import { CANNON_POSITION, GRAVITY } from "@/core/constants";
import { addV3, scaleV3 } from "@/lib/math";
import type { Entity, Vec3 } from "@/types/entity";

export function movementSystem(dt: number): void {
  const { entities, elapsedMs } = getState();
  const dtSec = dt * 0.001;

  const next: Entity[] = entities.map((e) => {
    // Bullets are projectiles: integrate velocity AND apply gravity. We do
    // a simple semi-implicit Euler step (update velocity first, then use
    // the new velocity for position) — accurate enough for a fixed flight
    // time of ~1.5s and visually indistinguishable from RK4 here.
    if (e.kind === "bullet") {
      const newVel: Vec3 = [
        e.velocity[0],
        e.velocity[1] - GRAVITY * dtSec,
        e.velocity[2],
      ];
      return {
        ...e,
        velocity: newVel,
        position: addV3(e.position, scaleV3(newVel, dtSec)),
      };
    }

    // Enemies: random-walk steering. The base heading still points at the
    // cannon, but we slap a slow sine-wave on top so monsters weave left and
    // right as they march. Each enemy's `wanderPhase` offsets the wave so
    // the line of attackers doesn't sway in unison. Dying enemies freeze.
    if (e.kind === "enemy") {
      if (e.dyingMs !== undefined) return e;

      const dx = CANNON_POSITION[0] - e.position[0];
      const dz = CANNON_POSITION[2] - e.position[2];
      const dist = Math.hypot(dx, dz);
      if (dist < 0.001) return e; // already on top of the cannon

      // `atan2(dx, dz)` returns the yaw such that sin(h),cos(h) = dx/d,dz/d
      // — i.e. the angle "pointing toward the cannon" in our axis convention.
      const baseHeading = Math.atan2(dx, dz);
      // Up to ~±28° of deviation, period ~5s. Tweak amplitude/frequency to
      // taste; bigger amplitude = more chaotic crowd.
      const wander = Math.sin(elapsedMs * 0.0012 + e.wanderPhase) * 0.5;
      const heading = baseHeading + wander;
      const vx = Math.sin(heading) * e.speed;
      const vz = Math.cos(heading) * e.speed;
      return {
        ...e,
        velocity: [vx, 0, vz],
        position: [
          e.position[0] + vx * dtSec,
          e.position[1],
          e.position[2] + vz * dtSec,
        ],
      };
    }

    // Non-projectiles: skip when stationary to avoid useless allocations.
    if (e.velocity[0] === 0 && e.velocity[1] === 0 && e.velocity[2] === 0) {
      return e;
    }
    return {
      ...e,
      position: addV3(e.position, scaleV3(e.velocity, dtSec)),
    };
  });

  dispatch({ type: "REPLACE_ENTITIES", entities: next });
}
