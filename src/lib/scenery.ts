// Builds the STATIC battlefield: ground zones (house strip / weapon strip / yard),
// the house, and the perimeter fence. These live for the whole session.

import * as THREE from "three";
import {
  DEFENSE_LINE_X,
  FENCE_SCALE,
  GROUND_COLOR,
  HOUSE_GAP,
  HOUSE_ROTATION_Y,
  SPAWN_X,
  STRIP_COLOR,
  YARD_COLOR,
  YARD_DEPTH,
  YARD_HALF_DEPTH,
  YARD_START_X,
} from "@/core/constants";
import { getModel, hasModel } from "@/lib/modelCache";
import { centerOnGround, measureSize, scaleToExtent } from "@/lib/helpers";

// Adds ground, zones, house and fence. The cannon is owned by the weapon renderer.
export function addScenery(scene: THREE.Scene): void {
  addGround(scene);
  addHouse(scene);
  addFence(scene);
}

// A flat coloured plane on the ground, centred on (cx, 0, cz).
function groundPlane(
  width: number,
  depth: number,
  cx: number,
  cz: number,
  color: number,
  y: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, y, cz);
  mesh.receiveShadow = true;
  return mesh;
}

// Neutral base, the gray weapon strip, and the green monster yard.
function addGround(scene: THREE.Scene): void {
  scene.add(
    groundPlane(80, YARD_DEPTH + 20, 0, 0, GROUND_COLOR, 0),
  );

  const stripW = YARD_START_X - DEFENSE_LINE_X;
  scene.add(
    groundPlane(
      stripW,
      YARD_DEPTH,
      (DEFENSE_LINE_X + YARD_START_X) / 2,
      0,
      STRIP_COLOR,
      0.01,
    ),
  );

  const yardW = SPAWN_X - YARD_START_X;
  scene.add(
    groundPlane(
      yardW,
      YARD_DEPTH,
      (YARD_START_X + SPAWN_X) / 2,
      0,
      YARD_COLOR,
      0.01,
    ),
  );
}

// The protected house on the left; its front spans the depth.
function addHouse(scene: THREE.Scene): void {
  let house: THREE.Object3D;

  if (hasModel("house")) {
    house = getModel("house");
    house.rotation.y = HOUSE_ROTATION_Y;
    scaleToExtent(house, YARD_DEPTH, "z");
    centerOnGround(house);
    // Place the house by its right edge, a fixed gap left of the gray strip.
    const halfX = measureSize(house).x / 2;
    house.position.x = DEFENSE_LINE_X - HOUSE_GAP - halfX;
  } else {
    house = new THREE.Mesh(
      new THREE.BoxGeometry(8, 10, YARD_DEPTH),
      new THREE.MeshStandardMaterial({ color: 0xb56a4a, roughness: 0.8 }),
    );
    house.position.set(DEFENSE_LINE_X - HOUSE_GAP - 4, 5, 0);
    house.castShadow = true;
    house.receiveShadow = true;
  }

  scene.add(house);
}

// Tiles fence segments along the far (-z) and right (+x spawn) edges.
function addFence(scene: THREE.Scene): void {
  if (!hasModel("fence")) return;

  // Measure one panel at the chosen scale to learn its natural length.
  const probe = getModel("fence");
  probe.scale.multiplyScalar(FENCE_SCALE);
  const size = measureSize(probe);
  const longIsX = size.x >= size.z;
  const panelLen = Math.max(size.x, size.z) || 4;

  // Lay a seamless run of panels along an axis-aligned edge, stretching each so
  // they meet exactly with no overlap or gap.
  const placeRun = (x0: number, z0: number, x1: number, z1: number) => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const runLen = Math.hypot(dx, dz);
    if (runLen < 1e-3) return;

    const alongX = Math.abs(dx) >= Math.abs(dz);
    const n = Math.max(1, Math.round(runLen / panelLen));
    const cell = runLen / n;
    const stretch = cell / panelLen;
    const ux = dx / runLen;
    const uz = dz / runLen;
    const yaw = alongX
      ? longIsX
        ? 0
        : Math.PI / 2
      : longIsX
        ? -Math.PI / 2
        : 0;

    for (let i = 0; i < n; i++) {
      const t = cell * (i + 0.5);
      const seg = getModel("fence");
      seg.scale.multiplyScalar(FENCE_SCALE);
      if (longIsX) seg.scale.x *= stretch;
      else seg.scale.z *= stretch;
      seg.rotation.y = yaw;
      centerOnGround(seg);
      seg.position.x += x0 + ux * t;
      seg.position.z += z0 + uz * t;
      scene.add(seg);
    }
  };

  placeRun(DEFENSE_LINE_X, -YARD_HALF_DEPTH, SPAWN_X, -YARD_HALF_DEPTH);
  placeRun(SPAWN_X, -YARD_HALF_DEPTH, SPAWN_X, YARD_HALF_DEPTH);
}
