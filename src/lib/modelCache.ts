/* =============================================================================
 * src/lib/modelCache.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Load every authored .glb ONCE at startup, keep the parsed scene in memory,
 *   and hand out cheap clones on demand. This is the single place that knows
 *   how to fetch a model file and turn it into a scene-ready Object3D.
 *
 * WHY IT EXISTS
 *   GLTFLoader does a runtime fetch + parse — expensive. Enemies spawn many
 *   times per wave, so loading per-spawn would stutter and re-download. Instead
 *   we preload each file once (`preloadModels`) and `cloneModel` per use.
 *
 *   Entity factories call `cloneModel(...)`. If the model isn't loaded (e.g.
 *   the fetch failed) they get `null` and fall back to their procedural mesh,
 *   so the game always renders something.
 *
 * WHAT BELONGS HERE
 *   - The key → URL registry
 *   - preload + clone + normalise helpers
 *
 * WHAT DOES NOT BELONG HERE
 *   - Per-entity transforms (scale/rotation tuning lives in the entity factory)
 *   - Game logic
 * ============================================================================= */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/** Logical names for every model the game uses. Add a row here + a URL below
 *  and the cache handles the rest. */
export type ModelKey =
  | "house"
  | "cannon"
  | "fence"
  | "enemy:grunt"
  | "enemy:stalker"
  | "enemy:brute";

/** Where each model lives under `public/`. Filenames with spaces are fine —
 *  they're URL-encoded before fetch. */
const MODEL_URLS: Record<ModelKey, string> = {
  house: "/models/house.glb",
  cannon: "/models/Cannon.glb",
  fence: "/models/Fence.glb",
  "enemy:grunt": "/models/Skeleton.glb", // weakest
  "enemy:stalker": "/models/Zombie.glb", // medium
  "enemy:brute": "/models/Big arm.glb", // hardest
};

/** Parsed source scenes, keyed by name. Populated by `preloadModels`. */
const sources = new Map<ModelKey, THREE.Object3D>();

/**
 * Fetch + parse every model once. Call this before starting the game loop.
 * A single failed model logs and is skipped — the rest still load, and the
 * affected entity falls back to its procedural mesh.
 */
export async function preloadModels(): Promise<void> {
  const loader = new GLTFLoader();
  const keys = Object.keys(MODEL_URLS) as ModelKey[];

  await Promise.all(
    keys.map(async (key) => {
      try {
        const gltf = await loader.loadAsync(encodeURI(MODEL_URLS[key]));
        sources.set(key, gltf.scene);
      } catch (err) {
        console.error(`[modelCache] failed to load "${key}" (${MODEL_URLS[key]})`, err);
      }
    }),
  );

  console.log("[modelCache] preload done. loaded:", [...sources.keys()]);
}

/**
 * Deep-clone a preloaded model, or `null` if it never loaded. Uses
 * SkeletonUtils so rigged/animated meshes clone correctly (a plain
 * `.clone()` would share the skeleton between copies).
 */
export function cloneModel(key: ModelKey): THREE.Object3D | null {
  const src = sources.get(key);
  if (!src) return null;
  const obj = cloneSkinned(src);
  // Animated/skinned characters can self-cull when their bind-pose bounding
  // volume doesn't match the scaled-down clone — disable culling so they
  // always draw. Cheap for our handful of on-screen models.
  obj.traverse((o) => {
    o.frustumCulled = false;
  });
  return obj;
}

/**
 * Scale a model to a target size and seat it on the ground (base at y=0,
 * centred on x/z) — so any export lands at a predictable size regardless of
 * the units it was authored in. Mutates `obj` in place.
 *
 * Pass `height` to fit the model's vertical extent, or `width` to fit its
 * larger horizontal extent. `height` wins if both are given.
 */
export function normalizeModel(
  obj: THREE.Object3D,
  target: { width?: number; height?: number },
): void {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());

  let scale = 1;
  if (target.height) scale = target.height / (size.y || 1);
  else if (target.width) scale = target.width / (Math.max(size.x, size.z) || 1);
  obj.scale.multiplyScalar(scale);

  // Re-measure after scaling, then centre x/z and drop the base onto y=0.
  box.setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
}
