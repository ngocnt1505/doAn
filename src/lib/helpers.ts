/* =============================================================================
 * src/lib/helpers.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Small shared utilities. Currently: geometry helpers that normalise loaded
 *   GLB models, whose authored scale/pivot are arbitrary, into predictable
 *   world units so scenery and entities can place them deterministically.
 *
 * WHAT BELONGS HERE
 *   - Pure, dependency-light helpers reused across the codebase
 *
 * WHAT DOES NOT BELONG HERE
 *   - System/gameplay logic, React, state
 * ============================================================================= */

import * as THREE from "three";

/** Axis-aligned size (width/height/depth) of an object in world units. */
export function measureSize(obj: THREE.Object3D): THREE.Vector3 {
  return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
}

/**
 * Uniformly scale `obj` so its extent along `axis` equals `target` units.
 * Returns the scale factor applied. Call before {@link centerOnGround}.
 */
export function scaleToExtent(
  obj: THREE.Object3D,
  target: number,
  axis: "x" | "y" | "z" = "x",
): number {
  const size = measureSize(obj);
  const current = size[axis];
  if (current === 0) return 1;
  const factor = target / current;
  obj.scale.multiplyScalar(factor);
  return factor;
}

/**
 * Recentre `obj` horizontally over the origin and drop it so its lowest point
 * rests on the ground plane (y = 0). Apply any final position offset afterward.
 */
export function centerOnGround(obj: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
}
