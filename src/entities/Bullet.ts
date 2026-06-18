/* =============================================================================
 * src/entities/Bullet.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 5/7/8 — Bullet entity (factory).
 *   Plain-data factory for a projectile (SRS FR-16). A bullet launches from the
 *   muzzle (`origin`) and flies to the clicked `target`; the movement system
 *   advances `elapsed` and updates `position` along a ballistic arc. Damage is
 *   added in a later milestone.
 * ============================================================================= */

import type { Bullet, Vec3 } from "@/types/entity";

let nextId = 0;

/** Create one bullet launching from `origin` (the weapon muzzle, SRS BR-55)
 *  toward `target` (the clicked landing point). It starts at the origin with no
 *  elapsed flight time. */
export function createBullet(origin: Vec3, target: Vec3): Bullet {
  return {
    id: `bullet-${nextId++}`,
    origin: { ...origin },
    target: { ...target },
    position: { ...origin },
    elapsed: 0,
  };
}
