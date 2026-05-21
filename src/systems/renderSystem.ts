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
import type { ThreeContext } from "@/lib/threeSetup";
import type { Entity } from "@/types/entity";
import { createPlayerMesh } from "@/entities/Player";
import { createEnemyMesh } from "@/entities/Enemy";
import { createBulletMesh } from "@/entities/Bullet";
import { createHouseMesh } from "@/entities/House";

/** The render system is the only system that needs Three.js objects. */
export type RenderContext = ThreeContext;

/** Map of entityId → its current mesh in the scene. Persists across frames. */
const meshes = new Map<string, THREE.Object3D>();

function meshFor(entity: Entity): THREE.Object3D {
  switch (entity.kind) {
    case "player": return createPlayerMesh();
    case "enemy":  return createEnemyMesh(entity.id);
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
