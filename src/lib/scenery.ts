/* =============================================================================
 * src/lib/scenery.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factories for STATIC world geometry: things that exist purely to make the
 *   yard look like a yard. Today: the perimeter fence along the far side.
 *
 *   Scenery is non-interactive — it never becomes an entity, never collides,
 *   never moves. `threeSetup.ts` builds it once at startup and the renderer
 *   never touches it again.
 *
 * WHAT BELONGS HERE
 *   - Reusable mesh factories for non-entity props (fences, posts, walls...)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Entity factories (`src/entities/*`)
 *   - Per-frame logic
 *   - Direct calls to renderer / scene — return a mesh; the caller wires it
 * ============================================================================= */

import * as THREE from "three";
import { cloneModel, normalizeModel } from "./modelCache";

/** Width (m) each tiled copy of the fence model spans along the row. */
const FENCE_SEGMENT_WIDTH = 4;

/** Yaw (radians) applied to each fence segment so its panel faces +/- z. Turn
 *  by ±Math.PI / 2 if the imported fence runs the wrong way. */
const FENCE_YAW = 0;

/**
 * Build a row of fence segments along the x-axis. The whole row is returned as
 * a single Group anchored at the origin — translate that group to place the
 * row in the world. Default orientation has the panel facing +/- z (so it
 * makes a north or south wall when dropped on the back edge of a yard).
 *
 * Tiles the authored `Fence.glb` if it loaded; otherwise builds the procedural
 * wooden fence below so the yard is always walled-off.
 *
 * @param length  Total length in meters.
 * @param spacing Distance between posts in the procedural fallback (m).
 */
export function buildFenceRow(length: number, spacing = 1.6): THREE.Group {
  const row = new THREE.Group();
  row.name = "fence-row";

  if (cloneModel("fence")) {
    const count = Math.max(1, Math.round(length / FENCE_SEGMENT_WIDTH));
    for (let i = 0; i < count; i++) {
      const seg = cloneModel("fence")!;
      normalizeModel(seg, { width: FENCE_SEGMENT_WIDTH });
      seg.rotation.y = FENCE_YAW;
      // Lay segments end-to-end, centring the whole run on the origin.
      seg.position.x = -length / 2 + FENCE_SEGMENT_WIDTH * (i + 0.5);
      row.add(seg);
    }
    return row;
  }

  // ---- Procedural fallback (model failed to load) -----------------------
  // Match the cannon's "weathered timber" wood; rails get a slightly darker
  // tone so the silhouette of post-vs-rail reads from a distance.
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x6b3e1f, metalness: 0.0, roughness: 0.9,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x5a3418, metalness: 0.0, roughness: 0.9,
  });

  const postGeo = new THREE.BoxGeometry(0.18, 1.2, 0.18);
  const postCount = Math.max(2, Math.floor(length / spacing) + 1);
  const step = length / (postCount - 1);

  for (let i = 0; i < postCount; i++) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(-length / 2 + i * step, 0.6, 0);
    row.add(post);
  }

  // Two horizontal rails connecting all posts in one span. Slimmer than the
  // posts so the joint reads as a rail-on-post, not a continuous wall.
  const railGeo = new THREE.BoxGeometry(length, 0.12, 0.1);
  const railLow = new THREE.Mesh(railGeo, railMat);
  railLow.position.set(0, 0.35, 0);
  const railHigh = new THREE.Mesh(railGeo, railMat);
  railHigh.position.set(0, 0.95, 0);
  row.add(railLow, railHigh);

  return row;
}
