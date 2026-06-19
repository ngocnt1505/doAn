/* =============================================================================
 * src/systems/collisionSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 6 · Combat Pipeline — area-of-effect impact resolution (SRS FR-19 /
 *   FR-38). When a projectile lands, this computes how much damage each enemy
 *   takes from the blast based on its distance to the impact point.
 *
 *   Damage falls off linearly with distance (SRS damage formula):
 *
 *       d = distance from the impact point to the enemy
 *       R = blast radius (BLAST_RADIUS)
 *       D = weapon damage carried by the projectile
 *
 *       Damage = D · (1 − d/R)   for 0 ≤ d ≤ R
 *       Damage = 0               for d > R
 *
 *   So an enemy at the exact impact point takes the full weapon damage D
 *   (BR-69), nearer enemies take more than farther ones (BR-67/68), and enemies
 *   outside the radius take none (BR-126). DEAD enemies are skipped — destroyed
 *   enemies no longer participate in collision (BR-73).
 *
 *   This file is PURE: it reads enemy data and returns the damage to apply. The
 *   caller dispatches DAMAGE_ENEMY for each hit, so the reducer stays the single
 *   place that mutates state.
 * ============================================================================= */

import type { Enemy, GroundPos } from "@/types/entity";

/** One enemy's share of a blast: how much damage to deal to it. */
export interface BlastHit {
  id: string;
  amount: number;
}

/** Resolve a projectile impact at `impact` into per-enemy damage (SRS FR-19 /
 *  FR-38). For every LIVING enemy within `radius`, returns `D · (1 − d/R)`;
 *  enemies that are dead or outside the radius are omitted. */
export function resolveImpact(
  enemies: Enemy[],
  impact: GroundPos,
  weaponDamage: number,
  radius: number,
): BlastHit[] {
  const hits: BlastHit[] = [];
  for (const enemy of enemies) {
    if (enemy.state === "dead") continue; // destroyed → no collision (BR-73)
    const dx = enemy.pos.x - impact.x;
    const dz = enemy.pos.z - impact.z;
    const distance = Math.hypot(dx, dz);
    if (distance > radius) continue; // outside the blast → no damage (BR-126)
    const amount = weaponDamage * (1 - distance / radius);
    if (amount > 0) hits.push({ id: enemy.id, amount });
  }
  return hits;
}
