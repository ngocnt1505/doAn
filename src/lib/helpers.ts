// Small shared geometry helpers that normalise loaded GLB models into predictable
// world units so scenery and entities can place them deterministically.

import * as THREE from "three";

// Axis-aligned size (width/height/depth) of an object in world units.
export function measureSize(obj: THREE.Object3D): THREE.Vector3 {
  return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
}

// Uniformly scale `obj` so its extent along `axis` equals `target` units.
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

// Recentre `obj` horizontally over the origin and drop it so its lowest point
// rests on the ground plane (y = 0).
export function centerOnGround(obj: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
}
