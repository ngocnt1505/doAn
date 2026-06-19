/* =============================================================================
 * src/entities/Bullet.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 5/7/8 + Phase 6 — Bullet entity (factory).
 *   Plain-data factory for a projectile (SRS FR-16). A bullet launches from the
 *   muzzle (`origin`) and flies to the clicked `target`; the movement system
 *   advances `elapsed` and updates `position` along a ballistic arc. It carries
 *   the weapon's `damage`, applied as area-of-effect falloff when it lands.
 * ============================================================================= */

import type { Bullet, Vec3 } from "@/types/entity";

let nextId = 0;

/** Create one bullet launching from `origin` (the weapon muzzle, SRS BR-55)
 *  toward `target` (the clicked landing point), carrying `damage` — the weapon
 *  damage D applied at impact (SRS FR-19) — and reaching the target after
 *  `flightTime` seconds (per-weapon travel speed, SRS BR-61). It starts at the
 *  origin with no elapsed flight time. */
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
