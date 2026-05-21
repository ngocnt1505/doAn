/* =============================================================================
 * src/lib/camera.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Constructs and configures the Three.js camera. Owns nothing else —
 *   no scene, no renderer.
 *
 * WHY IT EXISTS
 *   Camera tuning (FOV, aspect, near/far, position) is a frequent thing
 *   to tweak. Isolating it makes those changes obvious and avoids growing
 *   `threeSetup.ts` into a god-file.
 *
 * WHAT BELONGS HERE
 *   - PerspectiveCamera / OrthographicCamera creation
 *   - Resize handling helpers
 *   - Camera follow / shake helpers (future)
 *
 * WHAT DOES NOT BELONG HERE
 *   - The scene or renderer
 *   - Per-frame game logic — call camera helpers from systems instead
 * ============================================================================= */

import * as THREE from "three";

/** Build a sensible default camera for a top-down-ish gameplay view. */
export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    60,                 // fov
    width / height,     // aspect (updated on resize)
    0.1,                // near
    200,                // far
  );

  // Slight elevation + tilt so the player sees the field in front of them.
  camera.position.set(0, 12, 16);
  camera.lookAt(0, 0, 0);

  return camera;
}

/** Keep the camera in sync with the canvas size. Called on `resize`. */
export function resizeCamera(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// TODO: implement camera follow / smooth damping when the player can move.
