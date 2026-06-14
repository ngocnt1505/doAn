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

// NOTE: the camera looks near the world origin, NOT the yard centre. The yard
// is intentionally right-aligned (see YARD_CENTER_X) so the open strip on the
// left holds the house — the camera frame spans both, with the yard on the
// right and the house on the left.

/**
 * Build the gameplay camera. The cannon is parked on the LEFT and enemies
 * advance from the RIGHT, so the action runs along the x-axis. The camera
 * sits to the SIDE (along +z) and slightly above, giving a clean profile
 * view of the cannon, the arc of every shot, and the incoming line of foes.
 */
export function createCamera(width: number, height: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    55,                 // fov — narrower than a freelook camera, keeps yard centred
    width / height,     // aspect (updated on resize)
    0.1,                // near
    200,                // far
  );

  // Side view: stand off to the +z edge, look back near the world origin so
  // the right half of the frame holds the yard and the left half shows the
  // house. Height of ~8m gives a gentle downward tilt without flattening the
  // scene into a top-down view.
  // Pan the framing a touch to the left (toward the house) by shifting both
  // the camera and its target the same amount along -x — keeps the same angle,
  // just recentres the view.
  camera.position.set(6, 8, 22);
  camera.lookAt(6, 0, 0);

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
