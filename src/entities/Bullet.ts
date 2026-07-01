// Plain-data factory for a projectile. A bullet launches from the muzzle
// (`origin`), flies to `target` over `flightTime`, and carries the weapon
// `damage` applied as area-of-effect falloff on impact.

import type { Bullet, Vec3 } from "@/types/entity";

let nextId = 0;

// Create one bullet, starting at the origin with no elapsed flight time.
export function createBullet(
  origin: Vec3,
  target: Vec3,
  damage: number,
  flightTime: number,
  isBigShot = false,
): Bullet {
  return {
    id: `bullet-${nextId++}`,
    origin: { ...origin },
    target: { ...target },
    position: { ...origin },
    elapsed: 0,
    flightTime,
    damage,
    isBigShot,
  };
}
