/* =============================================================================
 * src/lib/camera.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Builds and frames the perspective camera that watches the battlefield
 *   (SRS FR-33). Positioned on the player's side (+z), raised and angled down so
 *   the whole field and the house at the far edge stay in view.
 *
 * WHAT BELONGS HERE
 *   - Camera construction and default framing
 *
 * WHAT DOES NOT BELONG HERE
 *   - Renderer / scene (→ `threeSetup.ts`)
 *   - Raycasting from the camera (→ `raycasting.ts`)
 * ============================================================================= */

import * as THREE from "three";
import { CAMERA_FOV, CAMERA_LOOK, CAMERA_POS } from "@/core/constants";

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
  camera.position.set(...CAMERA_POS);
  camera.lookAt(new THREE.Vector3(...CAMERA_LOOK));
  return camera;
}
