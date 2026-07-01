// A floating enemy health bar: a small two-plane billboard (dark background +
// colored fill) that shrinks from the right and shifts green → yellow → red as
// health drops, always facing the camera. Pure rendering helper (Three.js only).

import * as THREE from "three";

// Bar size in world units (independent of enemy model scale).
const BAR_WIDTH = 2.4;
const BAR_HEIGHT = 0.36;
// Border thickness of the dark background behind the fill.
const BORDER = 0.12;

export interface HealthBar {
  group: THREE.Group;
  setFraction: (fraction: number) => void;
  faceCamera: (camera: THREE.Camera) => void;
  dispose: () => void;
}

// Build a fresh health bar (full + green until setFraction is called).
export function createHealthBar(): HealthBar {
  const group = new THREE.Group();

  // Drawn over everything (depthTest off) so a bar is never hidden.
  const bgMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.55,
    depthTest: false,
    side: THREE.DoubleSide,
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
  fill.position.z = 0.001;
  fill.renderOrder = 999;

  group.add(background, fill);

  const color = new THREE.Color();

  return {
    group,
    // Resize + recolor the fill from a health fraction in [0, 1].
    setFraction(fraction) {
      const f = Math.max(0, Math.min(1, fraction));
      // Shrink from the right: scale the fill and shift it left so its left edge
      // stays pinned.
      fill.scale.x = Math.max(f, 1e-4);
      fill.position.x = (BAR_WIDTH / 2) * (f - 1);
      // Hue 0 = red … 0.33 = green, so full HP is green and fades to red.
      color.setHSL(0.33 * f, 0.9, 0.5);
      fillMaterial.color.copy(color);
    },
    // Orient the bar to face the camera (billboard). Call each frame.
    faceCamera(camera) {
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
