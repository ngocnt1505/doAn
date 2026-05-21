/* =============================================================================
 * src/lib/math.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Tiny math helpers used by systems and entities: vector ops, clamping,
 *   linear interpolation, etc. All pure functions, no imports of Three.js.
 *
 * WHY IT EXISTS
 *   Systems work on `Vec3` tuples (from `src/types/entity.ts`), not on
 *   Three.js `Vector3`s. This keeps simulation independent of the
 *   rendering library. The helpers below are the glue.
 *
 * WHAT BELONGS HERE
 *   - Pure scalar / vector math
 *
 * WHAT DOES NOT BELONG HERE
 *   - Anything that imports `three`
 *   - Game-specific logic ("how a bullet moves" belongs in a system)
 * ============================================================================= */

import type { Vec3 } from "@/types/entity";

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const addV3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const subV3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const scaleV3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

export const lengthV3 = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

export const normalizeV3 = (a: Vec3): Vec3 => {
  const len = lengthV3(a);
  return len > 0 ? [a[0] / len, a[1] / len, a[2] / len] : [0, 0, 0];
};

/** Squared distance — cheaper than `distance` when only comparing magnitudes. */
export const distanceSqV3 = (a: Vec3, b: Vec3) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
};
