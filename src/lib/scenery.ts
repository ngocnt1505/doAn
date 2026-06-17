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

  const sample = getModel("fence");
  sample.scale.multiplyScalar(FENCE_SCALE);
  const size = measureSize(sample);
  const runsAlongX = size.x >= size.z;
  const segLength = Math.max(size.x, size.z) || 4;
  const baseYaw = runsAlongX ? 0 : Math.PI / 2;

  const placeSeg = (x: number, z: number, yaw: number) => {
    const seg = getModel("fence");
    seg.scale.multiplyScalar(FENCE_SCALE);
    seg.rotation.y = yaw;
    centerOnGround(seg);
    seg.position.x += x;
    seg.position.z += z;
    scene.add(seg);
  };

  const tileAlongX = (z: number, x0: number, x1: number) => {
    const n = Math.max(1, Math.ceil((x1 - x0) / segLength));
    const step = (x1 - x0) / n;
    for (let i = 0; i < n; i++) placeSeg(x0 + step * (i + 0.5), z, baseYaw);
  };
  const tileAlongZ = (x: number, z0: number, z1: number) => {
    const n = Math.max(1, Math.ceil((z1 - z0) / segLength));
    const step = (z1 - z0) / n;
    for (let i = 0; i < n; i++) {
      placeSeg(x, z0 + step * (i + 0.5), baseYaw + Math.PI / 2);
    }
  };

  // Far edge (across the field) and right edge (the spawn side).
  tileAlongX(-YARD_HALF_DEPTH, DEFENSE_LINE_X, SPAWN_X);
  tileAlongZ(SPAWN_X, -YARD_HALF_DEPTH, YARD_HALF_DEPTH);
}
