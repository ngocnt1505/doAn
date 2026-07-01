// Projectile movement. Advances every bullet from the muzzle to its target along
// a ballistic arc that lands exactly on target at t = flightTime, then drops the
// bullet after a short linger.

import type { Bullet, Vec3 } from "@/types/entity";
import { BULLET_GRAVITY, BULLET_LINGER } from "@/core/constants";

// Ballistic world position at `t` seconds into a flight of length `T`.
// Horizontal velocity is constant; vertical velocity is solved to land on target.
function ballisticPosition(origin: Vec3, target: Vec3, t: number, T: number): Vec3 {
  const g = BULLET_GRAVITY;
  const vx = (target.x - origin.x) / T;
  const vz = (target.z - origin.z) / T;
  const vy = (target.y - origin.y - 0.5 * g * T * T) / T;
  return {
    x: origin.x + vx * t,
    y: origin.y + vy * t + 0.5 * g * t * t,
    z: origin.z + vz * t,
  };
}

// Advance every bullet by `dt`, dropping any whose lifetime is up. A landed
// bullet rests on the target during the linger. Returns a new array.
export function moveBullets(bullets: Bullet[], dt: number): Bullet[] {
  const next: Bullet[] = [];
  for (const bullet of bullets) {
    const elapsed = bullet.elapsed + dt;
    if (elapsed >= bullet.flightTime + BULLET_LINGER) continue;
    const position =
      elapsed >= bullet.flightTime
        ? { ...bullet.target }
        : ballisticPosition(bullet.origin, bullet.target, elapsed, bullet.flightTime);
    next.push({ ...bullet, elapsed, position });
  }
  return next;
}
