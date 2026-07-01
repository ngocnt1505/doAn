// Builds and frames the perspective camera that watches the battlefield,
// positioned high on the player's side and angled down.

import * as THREE from "three";
import { CAMERA_FOV, CAMERA_LOOK, CAMERA_POS } from "@/core/constants";

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
  camera.position.set(...CAMERA_POS);
  camera.lookAt(new THREE.Vector3(...CAMERA_LOOK));
  return camera;
}
