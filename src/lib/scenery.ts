/* =============================================================================
 * src/lib/scenery.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Builds the STATIC battlefield (SRS FR-5/FR-6) in the player-POV layout:
 *     [ house (left, may be cut) ] [ gray weapon strip ] [ green yard ] → spawn
 *   Plus the fence along the far and right edges. These objects live for the
 *   whole session and never change, so they are created once here.
 *
 *   Models come from the cache (`modelCache.ts`); if a .glb failed to load the
 *   scene falls back to a primitive so the game still renders (SRS Reliability).
 *
 * WHAT DOES NOT BELONG HERE
 *   - Dynamic entities (enemies, bullets) → `src/entities/*`
 *   - Lighting (→ `lighting.ts`), GLB loading (→ `modelCache.ts`)
 * ============================================================================= */

import * as THREE from "three";
import {
  DEFENSE_LINE_X,
  FENCE_SCALE,
  GROUND_COLOR,
  HOUSE_GAP,
  HOUSE_ROTATION_Y,
  SPAWN_X,
  STRIP_COLOR,
  WEAPON_ROTATION_Y,
  WEAPON_WIDTH,
  WEAPON_X,
  YARD_COLOR,
  YARD_DEPTH,
  YARD_HALF_DEPTH,
  YARD_START_X,
} from "@/core/constants";
import { getModel, hasModel } from "@/lib/modelCache";
import { centerOnGround, measureSize, scaleToExtent } from "@/lib/helpers";

/** Adds ground, zones, house, weapon and fence to the scene (SRS FR-5). */
export function addScenery(scene: THREE.Scene): void {
  addGround(scene);
  addHouse(scene);
  addWeapon(scene);
  addFence(scene);
}

/** A flat coloured plane on the ground, centred on (cx, 0, cz). */
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

/** Neutral base, the gray weapon strip, and the green monster yard (FR-5). */
function addGround(scene: THREE.Scene): void {
  // Wide neutral base under everything (incl. under the cut-off house).
  scene.add(
    groundPlane(80, YARD_DEPTH + 20, 0, 0, GROUND_COLOR, 0),
  );

  // Gray weapon strip: between the house front and the yard.
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

  // Green yard: monsters only.
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

/** The protected house on the left; its front spans the depth (SRS BR-12). */
function addHouse(scene: THREE.Scene): void {
  let house: THREE.Object3D;

  if (hasModel("house")) {
    house = getModel("house");
    house.rotation.y = HOUSE_ROTATION_Y; // front (door) faces the yard (+x)
    scaleToExtent(house, YARD_DEPTH, "z"); // front spans the full width
    centerOnGround(house);
    // Place the house by its RIGHT edge, a fixed gap left of the gray strip, so
    // it never touches it regardless of the model's width (extends left/cut).
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

/** The player's cannon, parked in the gray strip between house and yard. */
function addWeapon(scene: THREE.Scene): void {
  let weapon: THREE.Object3D;

  if (hasModel("weaponBasic")) {
    weapon = getModel("weaponBasic");
    scaleToExtent(weapon, WEAPON_WIDTH, "x");
    weapon.rotation.y = WEAPON_ROTATION_Y;
    centerOnGround(weapon);
    weapon.position.x += WEAPON_X;
  } else {
    weapon = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.2, 2),
      new THREE.MeshStandardMaterial({ color: 0x444a52, roughness: 0.6 }),
    );
    weapon.position.set(WEAPON_X, 0.6, 0);
    weapon.castShadow = true;
  }

  scene.add(weapon);
}

/** Tiles fence segments along the far (-z) and right (+x spawn) edges (FR-5). */
function addFence(scene: THREE.Scene): void {
  if (!hasModel("fence")) return; // decorative; skip if unavailable

  // Measure one panel at the chosen scale to learn its natural length.
  const probe = getModel("fence");
  probe.scale.multiplyScalar(FENCE_SCALE);
  const size = measureSize(probe);
  const longIsX = size.x >= size.z; // which local axis the panel runs along
  const panelLen = Math.max(size.x, size.z) || 4;

  // Lay a SEAMLESS run of panels along an axis-aligned edge (x0,z0)→(x1,z1).
  // We round to a whole number of panels, then stretch each by `cell/panelLen`
  // so they meet exactly — no overlap, no gap, at any FENCE_SCALE.
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
    // Yaw that points the panel's long (local) axis along the run direction.
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
      // Stretch only the long axis so the panel spans exactly one cell.
      if (longIsX) seg.scale.x *= stretch;
      else seg.scale.z *= stretch;
      seg.rotation.y = yaw;
      centerOnGround(seg);
      seg.position.x += x0 + ux * t;
      seg.position.z += z0 + uz * t;
      scene.add(seg);
    }
  };

  // Far edge (across the field) and right edge (the spawn side).
  placeRun(DEFENSE_LINE_X, -YARD_HALF_DEPTH, SPAWN_X, -YARD_HALF_DEPTH);
  placeRun(SPAWN_X, -YARD_HALF_DEPTH, SPAWN_X, YARD_HALF_DEPTH);
}
