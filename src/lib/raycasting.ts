/* =============================================================================
 * src/lib/raycasting.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Helpers for screen-space → world-space queries: "what is under the
 *   mouse?", "where on the ground does this click point to?".
 *
 * WHY IT EXISTS
 *   Picking is needed for click-to-shoot, click-to-move, and selection.
 *   The math is identical across features, so it lives in one helper
 *   instead of being copy-pasted into systems.
 *
 * WHAT BELONGS HERE
 *   - Raycaster construction
 *   - Helpers that translate pointer events into world coordinates
 *
 * WHAT DOES NOT BELONG HERE
 *   - Game decisions ("this click means shoot") — belongs in a system
 *   - State (the raycaster is stateless from the caller's view)
 * ============================================================================= */

import * as THREE from "three";

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/**
 * Cast a ray from the camera through a pointer position and return the
 * first hit point on the given target. If nothing is hit, returns null.
 *
 *   @param event       Pointer/Mouse event
 *   @param canvas      The canvas the event is relative to
 *   @param camera      The active camera
 *   @param targets     Objects to test against (e.g. just the ground plane)
 */
export function pickWorldPoint(
  event: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  targets: THREE.Object3D[],
): THREE.Vector3 | null {
  const rect = canvas.getBoundingClientRect();

  // Normalised device coords: x,y in [-1, 1].
  ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length > 0 ? hits[0].point.clone() : null;
}

// TODO: add a `pickEntity()` helper that returns the entity id under the
// pointer once entities expose their id via `object.userData.entityId`.
