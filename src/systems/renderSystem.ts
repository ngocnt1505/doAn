/* =============================================================================
 * src/systems/renderSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Bridge the simulation (plain data) and Three.js (the scene graph). Every
 *   frame this system:
 *     1. Reads the current entity list from the store
 *     2. Ensures each entity has a matching Three.js mesh in `entityRoot`
 *     3. Removes meshes whose entity no longer exists
 *     4. Copies entity positions onto their meshes
 *     5. Calls `renderer.render(scene, camera)`
 *
 * WHY IT EXISTS
 *   This is the ONLY place in the game where state and Three.js meet. That
 *   discipline is what allows the simulation to stay testable and pure —
 *   nothing else needs to know that Three.js exists.
 *
 *   --- The rendering pipeline (read this once) ---
 *     state (data)
 *        │
 *        ▼
 *     renderSystem  ──── maintains a meshes-by-id map ───►  scene
 *        │
 *        ▼
 *     renderer.render(scene, camera)  ──►  pixels
 *
 * WHAT BELONGS HERE
 *   - Mesh creation / removal in response to entity changes
 *   - Copying position/rotation onto meshes
 *   - The actual `renderer.render(...)` call
 *
 * WHAT DOES NOT BELONG HERE
 *   - Game logic (no health, no input, no collision)
 *   - Scene construction (`src/lib/threeSetup.ts`)
 *   - Mesh shapes (`src/entities/*`)
 * ============================================================================= */

import * as THREE from "three";
import { getState } from "@/core/gameStore";
import { CANNON_POSITION, ENEMY_DEATH_MS } from "@/core/constants";
import type { ThreeContext } from "@/lib/threeSetup";
import type { Entity } from "@/types/entity";
import { CANNON_AIM_YAW_OFFSET, CANNON_PIVOT_NAME, createPlayerMesh } from "@/entities/Player";
import { createEnemyMesh, ENEMY_BODY_NAME } from "@/entities/Enemy";
import { createBulletMesh } from "@/entities/Bullet";
import { createHouseMesh } from "@/entities/House";

/** The render system is the only system that needs Three.js objects. */
export type RenderContext = ThreeContext;

/** Map of entityId → its current mesh in the scene. Persists across frames. */
const meshes = new Map<string, THREE.Object3D>();

function meshFor(entity: Entity): THREE.Object3D {
  switch (entity.kind) {
    case "player": return createPlayerMesh();
    case "enemy":  return createEnemyMesh(entity.id, entity.variant);
    case "bullet": return createBulletMesh(entity.id);
    case "house":  return createHouseMesh(entity.id);
  }
}

function disposeMesh(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const m = child as THREE.Mesh;
    m.geometry?.dispose?.();
    const mat = m.material;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose?.();
  });
}

export function renderSystem(ctx: RenderContext): void {
  const { renderer, scene, camera, entityRoot } = ctx;
  const { entities } = getState();

  // 1. Track which ids exist this frame so we can remove stale meshes after.
  const alive = new Set<string>();

  for (const entity of entities) {
    alive.add(entity.id);

    let mesh = meshes.get(entity.id);
    if (!mesh) {
      mesh = meshFor(entity);
      meshes.set(entity.id, mesh);
      entityRoot.add(mesh);
    }

    // Copy position from state → mesh.
    mesh.position.set(entity.position[0], entity.position[1], entity.position[2]);

    // Cannon: swivel the pivot (turret) so it faces the aim target on the XZ
    // plane. Yaw-only keeps the model upright and grounded; the pivot's local
    // +Z is "down the barrel" (see Player.ts), so atan2(dx, dz) points +Z at
    // the target, plus a per-model offset for the imported mesh's orientation.
    if (entity.kind === "player") {
      const pivot = mesh.getObjectByName(CANNON_PIVOT_NAME);
      if (pivot && entity.aimTarget) {
        const dx = entity.aimTarget[0] - entity.position[0];
        const dz = entity.aimTarget[2] - entity.position[2];
        pivot.rotation.y = Math.atan2(dx, dz) + CANNON_AIM_YAW_OFFSET;
      }
    }

    // Enemy: yaw the body so the monster faces the cannon while alive, and
    // play a brief topple-and-sink when `dyingMs` is counting down.
    if (entity.kind === "enemy") {
      const body = mesh.getObjectByName(ENEMY_BODY_NAME);
      if (body) {
        if (entity.dyingMs === undefined) {
          // Face the cannon on the XZ plane. Default forward in Three is -Z,
          // so this is the standard atan2 formula for "look at this point".
          const dx = CANNON_POSITION[0] - entity.position[0];
          const dz = CANNON_POSITION[2] - entity.position[2];
          body.rotation.y = Math.atan2(dx, dz) + Math.PI;
          body.rotation.x = 0;
          body.position.y = 0;
        } else {
          // Death animation: t goes 0 → 1 over ENEMY_DEATH_MS. Topple forward
          // (negative pitch since forward is -Z) and sink a little so the
          // corpse vanishes into the ground at the end.
          const t = 1 - Math.max(0, entity.dyingMs) / ENEMY_DEATH_MS;
          body.rotation.x = -t * (Math.PI / 2);
          body.position.y = -t * 0.4;
        }
      }
    }
  }

  // 2. Remove meshes whose entity went away.
  for (const [id, mesh] of meshes) {
    if (alive.has(id)) continue;
    entityRoot.remove(mesh);
    disposeMesh(mesh);
    meshes.delete(id);
  }

  // 3. Draw.
  renderer.render(scene, camera);
}
