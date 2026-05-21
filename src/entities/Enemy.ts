/* =============================================================================
 * src/entities/Enemy.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for an enemy: data + mesh. Same shape as Player.ts.
 *
 * WHY IT EXISTS
 *   The spawn system asks for many enemies per wave. Centralising their
 *   construction makes balance tweaks (health, speed) one-file changes.
 *
 * WHAT BELONGS HERE / NOT — see the comment block in Player.ts.
 * ============================================================================= */

import * as THREE from "three";
import type { EnemyEntity, Vec3 } from "@/types/entity";
import { ENEMY_BASE_HEALTH, ENEMY_BASE_SPEED } from "@/core/constants";
import { uid } from "@/lib/helpers";

export function createEnemyEntity(position: Vec3): EnemyEntity {
  return {
    id: uid("enemy"),
    kind: "enemy",
    position,
    velocity: [0, 0, 0],
    dead: false,
    health: ENEMY_BASE_HEALTH,
    speed: ENEMY_BASE_SPEED,
  };
}

export function createEnemyMesh(entityId: string): THREE.Object3D {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.9, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xe06b6b }),
  );
  mesh.name = "enemy";
  mesh.userData.entityId = entityId;
  return mesh;
}
