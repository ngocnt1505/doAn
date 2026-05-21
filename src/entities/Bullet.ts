/* =============================================================================
 * src/entities/Bullet.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for projectiles fired by the player (and, later, enemies).
 *
 * WHY IT EXISTS
 *   Bullets are short-lived and the most numerous entities; isolating
 *   their construction keeps the shooting system tidy.
 *
 * WHAT BELONGS HERE / NOT — see Player.ts.
 * ============================================================================= */

import * as THREE from "three";
import type { BulletEntity, Vec3 } from "@/types/entity";
import { BULLET_LIFETIME_MS, BULLET_SPEED } from "@/core/constants";
import { normalizeV3, scaleV3 } from "@/lib/math";
import { uid } from "@/lib/helpers";

export function createBulletEntity(
  ownerId: string,
  position: Vec3,
  direction: Vec3,
): BulletEntity {
  return {
    id: uid("bullet"),
    kind: "bullet",
    ownerId,
    position,
    // Velocity = unit direction * speed. Movement system uses this directly.
    velocity: scaleV3(normalizeV3(direction), BULLET_SPEED),
    dead: false,
    lifetime: BULLET_LIFETIME_MS,
  };
}

export function createBulletMesh(entityId: string): THREE.Object3D {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd76b }),
  );
  mesh.name = "bullet";
  mesh.userData.entityId = entityId;
  return mesh;
}
