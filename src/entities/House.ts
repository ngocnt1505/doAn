/* =============================================================================
 * src/entities/House.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for the "house" prop: a small cube-style cabin built from the
 *   same wood + metal palette as the cannon and monsters.
 *
 *   Today the house is purely decorative — `threeSetup` drops it into the
 *   scene behind the cannon and that's it. The optional entity flow is kept
 *   in place for the day a future feature wants the player to defend it.
 *
 * WHAT BELONGS HERE / NOT — see Player.ts.
 * ============================================================================= */

import * as THREE from "three";
import type { HouseEntity, Vec3 } from "@/types/entity";
import { uid } from "@/lib/helpers";
import { cloneModel, normalizeModel } from "@/lib/modelCache";

/** Footprint (m) we scale the imported model to, so the silhouette matches the
 *  rest of the scene regardless of the units it was authored in. */
const HOUSE_TARGET_WIDTH = 15;

export function createHouseEntity(position: Vec3, health = 200): HouseEntity {
  return {
    id: uid("house"),
    kind: "house",
    position,
    velocity: [0, 0, 0],
    dead: false,
    health,
  };
}

/**
 * Build the house mesh. Pass `entityId` only when wiring it to a game entity
 * (so the render system can reconcile it); omit it to drop the house into
 * the scene as plain scenery.
 */
export function createHouseMesh(entityId?: string): THREE.Object3D {
  const group = new THREE.Group();
  group.name = "house";
  if (entityId) group.userData.entityId = entityId;

  // Prefer the authored .glb. If it didn't load, fall through to the
  // procedural cabin below so the scene is never empty.
  const model = cloneModel("house");
  if (model) {
    normalizeModel(model, { width: HOUSE_TARGET_WIDTH });
    group.add(model);
    return group;
  }

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xb89970, metalness: 0.0, roughness: 0.9,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x5a2a2a, metalness: 0.0, roughness: 0.85,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3d2412, metalness: 0.0, roughness: 0.9,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x86b3c4, metalness: 0.2, roughness: 0.3,
    emissive: 0x223344, emissiveIntensity: 0.4,
  });

  // Walls — single chunky box. Feet on the ground so position.y of the
  // group can stay at 0.
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 2.6, 3.2),
    wallMat,
  );
  walls.position.y = 1.3;
  group.add(walls);

  // Roof — 4-sided pyramid (Cone with 4 radial segments = low-poly cube look).
  // Rotated 45° so corners face N/S/E/W rather than NE/SE/etc.
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.6, 4),
    roofMat,
  );
  roof.position.y = 3.4;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Door on the front (+z face — the side the camera looks at).
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.4, 0.08),
    doorMat,
  );
  door.position.set(0, 0.7, 1.62);
  group.add(door);

  // Two small windows flanking the door — glowing slightly to read at dusk.
  const windowGeo = new THREE.BoxGeometry(0.55, 0.55, 0.08);
  const windowL = new THREE.Mesh(windowGeo, windowMat);
  windowL.position.set(-1.1, 1.6, 1.62);
  const windowR = new THREE.Mesh(windowGeo, windowMat);
  windowR.position.set( 1.1, 1.6, 1.62);
  group.add(windowL, windowR);

  return group;
}
