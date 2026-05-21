/* =============================================================================
 * src/entities/House.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for a static "house" the player has to defend. Demonstrates a
 *   non-moving entity with health.
 *
 * WHY IT EXISTS
 *   Provides an example of a passive entity — useful as a contrast to
 *   the player/enemy/bullet trio.
 *
 * WHAT BELONGS HERE / NOT — see Player.ts.
 * ============================================================================= */

import * as THREE from "three";
import type { HouseEntity, Vec3 } from "@/types/entity";
import { uid } from "@/lib/helpers";

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

export function createHouseMesh(entityId: string): THREE.Object3D {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.6, 2),
    new THREE.MeshStandardMaterial({ color: 0x9b8262 }),
  );
  base.position.y = 0.8;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x6b3434 }),
  );
  roof.position.y = 2.2;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  group.userData.entityId = entityId;
  group.name = "house";
  return group;
}
