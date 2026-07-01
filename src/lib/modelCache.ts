// Loads and caches the GLB models listed in models.ts, then hands out ready-to-use
// clones so each instance gets its own copy without re-fetching. Enemies are
// skinned, so getModel uses a skeleton-aware clone.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { MODEL_KEYS, MODEL_PATHS, type ModelKey } from "@/lib/models";

interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

const cache = new Map<ModelKey, LoadedModel>();
const loader = new GLTFLoader();

// Load one model into the cache (no-op if already cached).
export async function loadModel(key: ModelKey): Promise<LoadedModel> {
  const cached = cache.get(key);
  if (cached) return cached;

  const gltf = await loader.loadAsync(MODEL_PATHS[key]);
  const loaded: LoadedModel = { scene: gltf.scene, animations: gltf.animations };
  cache.set(key, loaded);
  return loaded;
}

// Preload models up front. Missing files are skipped with a warning.
export async function preloadModels(
  keys: ModelKey[] = MODEL_KEYS,
): Promise<void> {
  await Promise.all(
    keys.map(async (key) => {
      try {
        await loadModel(key);
      } catch (err) {
        console.warn(
          `[modelCache] skipped "${key}" (${MODEL_PATHS[key]}) — file missing?`,
          err,
        );
      }
    }),
  );
}

// True once a model has been loaded; lets callers fall back to a placeholder.
export function hasModel(key: ModelKey): boolean {
  return cache.has(key);
}

// A fresh clone of a preloaded model, with shadows enabled on every mesh.
export function getModel(key: ModelKey): THREE.Object3D {
  const loaded = cache.get(key);
  if (!loaded) {
    throw new Error(
      `Model "${key}" is not loaded. Call preloadModels() before getModel().`,
    );
  }

  const root = cloneSkinned(loaded.scene);
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return root;
}

// Animation clips that shipped with a model (e.g. enemy walk/death).
export function getAnimations(key: ModelKey): THREE.AnimationClip[] {
  return cache.get(key)?.animations ?? [];
}
