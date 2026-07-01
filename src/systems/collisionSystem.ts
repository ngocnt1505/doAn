// Area-of-effect impact resolution. When a projectile lands, this computes how
// much damage each enemy takes, falling off linearly with distance:
//   Damage = D · (1 − d/R) for 0 ≤ d ≤ R, else 0.
// Pure: it reads enemy data and returns the damage to apply.

import type { Enemy, GroundPos } from "@/types/entity";

// One enemy's share of a blast.
export interface BlastHit {
  id: string;
  amount: number;
}

// Resolve an impact into per-enemy damage. Living enemies within `radius` get
// D·(1 − d/R); dead or out-of-range enemies are omitted.
export function resolveImpact(
  enemies: Enemy[],
  impact: GroundPos,
  weaponDamage: number,
  radius: number,
): BlastHit[] {
  const hits: BlastHit[] = [];
  for (const enemy of enemies) {
    if (enemy.state === "dead") continue;
    const dx = enemy.pos.x - impact.x;
    const dz = enemy.pos.z - impact.z;
    const distance = Math.hypot(dx, dz);
    if (distance > radius) continue;
    const amount = weaponDamage * (1 - distance / radius);
    if (amount > 0) hits.push({ id: enemy.id, amount });
  }
  return hits;
}
