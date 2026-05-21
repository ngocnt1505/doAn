/* =============================================================================
 * src/entities/Player.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for the player. Produces:
 *     - The player STATE (a `PlayerEntity` — plain data)
 *     - The player MESH (a `THREE.Object3D` for the renderer)
 *
 * WHY IT EXISTS
 *   Each entity has two faces: the data that systems mutate, and the
 *   visual that the renderer draws. Keeping both for one entity in one
 *   file makes the mapping obvious and easy to update.
 *
 * WHAT BELONGS HERE
 *   - Default values + mesh geometry/material for this kind
 *   - Constants that ONLY this entity cares about (otherwise put them in
 *     `src/core/constants.ts`)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Movement / shooting logic — those live in systems
 *   - Type definitions — see `src/types/entity.ts`
 * ============================================================================= */

import * as THREE from "three";
import type { PlayerEntity } from "@/types/entity";
import { PLAYER_ID, PLAYER_MAX_HEALTH } from "@/core/constants";

/** Build a fresh player state object. */
export function createPlayerEntity(): PlayerEntity {
  return {
    id: PLAYER_ID,
    kind: "player",
    position: [0, 0.5, 0], // half above the ground so the mesh sits on it
    velocity: [0, 0, 0],
    dead: false,
    health: PLAYER_MAX_HEALTH,
    lastShotAt: 0,
  };
}

/** Build the Three.js mesh that represents the player. */
export function createPlayerMesh(): THREE.Object3D {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x4ea1ff }),
  );
  mesh.name = "player";
  mesh.userData.entityId = PLAYER_ID;
  return mesh;
}
