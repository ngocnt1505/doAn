/* =============================================================================
 * src/systems/bulletSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 7/8 — Projectile movement.
 *   Advances every bullet from the muzzle to its target each frame.
 *
 *   M7 (pipeline) moved bullets in a straight line to prove the loop works:
 *   action → this system → reducer → render. M8 keeps that exact pipeline and
 *   only swaps the position function for a ballistic arc (SRS FR-36): classic
 *   projectile motion
 *
 *       position = start + velocity · t + ½ · gravity · t²
 *
 *   Horizontal velocity is constant (no drag); vertical velocity is solved so the
 *   bullet lands EXACTLY on the target at t = BULLET_FLIGHT_TIME, regardless of
 *   how far away it is (SRS BR-58/59/60 — arcs, never straight, always lands on
 *   target). A bullet that reaches its flight time snaps onto the target and
 *   holds there; impact + cleanup are a later milestone.
 * ============================================================================= */

import type { Bullet, Vec3 } from "@/types/entity";
import {
  BULLET_FLIGHT_TIME,
  BULLET_GRAVITY,
  BULLET_REMOVE_TIME,
} from "@/core/constants";

/** Ballistic world position at `t` seconds into the flight (0..flightTime). */
function ballisticPosition(origin: Vec3, target: Vec3, t: number): Vec3 {
  const T = BULLET_FLIGHT_TIME;
  const g = BULLET_GRAVITY;
  // Constant horizontal velocity: cover the x/z gap over the whole flight.
  const vx = (target.x - origin.x) / T;
  const vz = (target.z - origin.z) / T;
  // Vertical launch velocity solved from y(T) = target.y (the ½·g·T² lob term).
  const vy = (target.y - origin.y - 0.5 * g * T * T) / T;
  return {
    x: origin.x + vx * t,
    y: origin.y + vy * t + 0.5 * g * t * t,
    z: origin.z + vz * t,
  };
}

/** Advance every bullet by `dt` seconds, then DROP any whose lifetime is up —
 *  i.e. destroy it 1 s after it lands (M9 Bullet Destroy / SRS FR-39). A bullet
 *  that has reached its target sits exactly on it during the linger; otherwise it
 *  follows the arc. Returns a new array. */
export function moveBullets(bullets: Bullet[], dt: number): Bullet[] {
  const next: Bullet[] = [];
  for (const bullet of bullets) {
    const elapsed = bullet.elapsed + dt;
    if (elapsed >= BULLET_REMOVE_TIME) continue; // lifetime over → destroyed
    const position =
      elapsed >= BULLET_FLIGHT_TIME
        ? { ...bullet.target } // landed: rest on the target during the linger
        : ballisticPosition(bullet.origin, bullet.target, elapsed);
    next.push({ ...bullet, elapsed, position });
  }
  return next;
}
