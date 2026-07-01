// Adds the scene lighting: soft ambient fill plus a directional "sun" that casts
// shadows across the battlefield.

import * as THREE from "three";
import { BATTLEFIELD_HALF } from "@/core/constants";

export function addLighting(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.3);
  sun.position.set(18, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 100;

  // Size the shadow camera to cover the whole field.
  const s = BATTLEFIELD_HALF + 6;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;

  scene.add(sun);
}
