// Convert a 2D screen point into a 3D world position on the ground. The ground is
// treated as the mathematical plane y = 0 (not a mesh), so the hit is exact.

import * as THREE from "three";

// A world-space point on the ground plane (y ≈ 0).
export interface GroundHit {
  x: number;
  y: number;
  z: number;
}

export interface GroundPicker {
  // Raycast a canvas-relative point onto the ground plane, or null on a miss.
  pickGround: (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => GroundHit | null;
}

export function createGroundPicker(camera: THREE.Camera): GroundPicker {
  // Reused across calls — no per-click allocation.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  return {
    pickGround(x, y, width, height) {
      if (width === 0 || height === 0) return null;
      // Screen → normalized device coordinates (y flipped).
      ndc.set((x / width) * 2 - 1, -((y / height) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      const point = raycaster.ray.intersectPlane(ground, hit);
      if (!point) return null;
      return { x: point.x, y: point.y, z: point.z };
    },
  };
}
