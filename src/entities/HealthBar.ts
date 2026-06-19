/* =============================================================================
 * src/entities/HealthBar.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A floating enemy health bar (SRS FR-41). A small two-plane billboard — a dark
 *   background with a colored fill — that sits above an enemy and shows its
 *   remaining health. The fill shrinks from the right and shifts green → yellow →
 *   red as health drops, and the whole bar turns to face the camera each frame.
 *
 *   This is a pure RENDERING helper (Three.js only, no game state). The enemy
 *   renderer owns one per enemy: it positions it above the enemy, feeds it the
 *   health fraction, and disposes it with the rest of the enemy's view.
 *
 * WHAT DOES NOT BELONG HERE
 *   - Enemy data / health logic (lives in game state, set by the reducer)
 *   - Scene management (the caller adds/removes `group` from the scene)
 * ============================================================================= */

import * as THREE from "three";

/** Bar size in world units (independent of enemy model scale, so every bar reads
 *  the same size on screen). */
const BAR_WIDTH = 2.4;
const BAR_HEIGHT = 0.36;
/** Border thickness of the dark background behind the fill. */
const BORDER = 0.12;

export interface HealthBar {
  /** The renderable object — the caller adds this to the scene. */
  group: THREE.Group;
  /** Resize + recolor the fill from a health fraction in [0, 1]. */
  setFraction: (fraction: number) => void;
  /** Orient the bar to face the camera (billboard). Call each frame. */
  faceCamera: (camera: THREE.Camera) => void;
  /** Dispose geometries/materials. The caller removes `group` from the scene. */
  dispose: () => void;
}

/** Build a fresh health bar (full + green until `setFraction` is called). */
export function createHealthBar(): HealthBar {
  const group = new THREE.Group();

  // Drawn over everything (depthTest off) so a bar is never hidden behind a
  // nearer/larger monster — it always reads as an on-screen indicator.
  const bgMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
    side: THREE.DoubleSide, // visible regardless of which way it billboards
  });
  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH + BORDER, BAR_HEIGHT + BORDER),
    bgMaterial,
  );
  background.renderOrder = 998;

  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT),
    fillMaterial,
  );
  fill.position.z = 0.001; // sit just in front of the background
  fill.renderOrder = 999;

  group.add(background, fill);

  const color = new THREE.Color();

  return {
    group,
    setFraction(fraction) {
      const f = Math.max(0, Math.min(1, fraction));
      // Shrink from the right: scale the fill and shift it left so its LEFT edge
      // stays pinned (a centered plane scaled in place would shrink both sides).
      fill.scale.x = Math.max(f, 1e-4); // avoid a zero-scale degenerate matrix
      fill.position.x = (BAR_WIDTH / 2) * (f - 1);
      // Hue 0 = red … 0.33 = green, so full HP is green and it fades through
      // yellow to red as it empties (SRS BR-140).
      color.setHSL(0.33 * f, 0.9, 0.5);
      fillMaterial.color.copy(color);
    },
    faceCamera(camera) {
      // Copy the camera's orientation so the bar stays screen-aligned (a flat
      // billboard) rather than tilting toward the camera position.
      group.quaternion.copy(camera.quaternion);
    },
    dispose() {
      background.geometry.dispose();
      bgMaterial.dispose();
      fill.geometry.dispose();
      fillMaterial.dispose();
    },
  };
}
