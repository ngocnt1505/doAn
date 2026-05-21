/* =============================================================================
 * src/lib/lighting.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Adds default lighting to a scene: ambient + directional (sun-like).
 *
 * WHY IT EXISTS
 *   Lighting setup is short but consequential — bad lighting makes the
 *   whole scene look wrong. Keeping it here lets us iterate independently
 *   from scene & camera setup.
 *
 * WHAT BELONGS HERE
 *   - Light construction & placement
 *   - Shadow setup
 *
 * WHAT DOES NOT BELONG HERE
 *   - Mesh / geometry / material code
 *   - Animation of lights (do that in a system)
 * ============================================================================= */

import * as THREE from "three";

export function addDefaultLights(scene: THREE.Scene): void {
  // Soft fill so nothing is pure black.
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  // Direction & color picked to look like late afternoon sun.
  const sun = new THREE.DirectionalLight(0xfff1c4, 0.9);
  sun.position.set(8, 14, 6);
  scene.add(sun);

  // TODO: enable shadows once the scene has actual meshes that care about them.
  // sun.castShadow = true;
}
