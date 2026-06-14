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
import { BULLET_LIFETIME_MS } from "@/core/constants";
import { uid } from "@/lib/helpers";

/**
 * Cannon ball / projectile.
 *
 * Velocity is computed by the caller (the shooting system uses a parabolic
 * solve so the bullet lands on the clicked target). The movement system
 * integrates `velocity` and adds gravity each frame; cleanup retires it on
 * ground impact or once `lifetime` expires.
 */
export function createBulletEntity(
  ownerId: string,
  position: Vec3,
  velocity: Vec3,
): BulletEntity {
  return {
    id: uid("bullet"),
    kind: "bullet",
    ownerId,
    position,
    velocity,
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
