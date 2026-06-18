/* =============================================================================
 * src/lib/raycasting.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 2 — Ground Raycasting.
 *   Convert a 2D screen point (from the mouse, M1) into a 3D world position on
 *   the battlefield ground (SRS FR-15 steps 2-3: "raycast from the camera through
 *   the mouse position" → "world-space intersection point").
 *
 *   The ground is treated as the mathematical plane y = 0, not a mesh, so the hit
 *   is exact and independent of where the coloured floor planes happen to sit.
 *
 * SCOPE (Milestone 2)
 *   - Screen (canvas-relative) coords → normalized device coords → camera ray.
 *   - Intersect that ray with the ground plane; return the world point (or null
 *     if the ray is parallel to / points away from the ground).
 *
 * NOT YET (later milestones)
 *   - Validating the point is inside the green yard
 *   - Target marker, projectile, shooting
 * ============================================================================= */

import * as THREE from "three";

/** A world-space point on the ground plane (y ≈ 0). */
export interface GroundHit {
  x: number;
  y: number;
  z: number;
}

export interface GroundPicker {
  /**
   * Raycast a canvas-relative point onto the ground plane.
   * @param x  CSS pixels from the canvas's left edge.
   * @param y  CSS pixels from the canvas's top edge.
   * @param width   Canvas width in CSS pixels.
   * @param height  Canvas height in CSS pixels.
   * @returns the world hit, or `null` if the ray misses the ground plane.
   */
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
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0
  const hit = new THREE.Vector3();

  return {
    pickGround(x, y, width, height) {
      if (width === 0 || height === 0) return null;
      // Screen → normalized device coordinates (NDC): x,y ∈ [-1, 1], y flipped.
      ndc.set((x / width) * 2 - 1, -((y / height) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      const point = raycaster.ray.intersectPlane(ground, hit);
      if (!point) return null; // ray parallel to / pointing away from the ground
      return { x: point.x, y: point.y, z: point.z };
    },
  };
}
