/* =============================================================================
 * src/lib/models.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The single manifest of every 3D model the game loads. Maps a logical key
 *   (used everywhere in code) to the URL the file is served from. This is the
 *   asset information the SRS leaves abstract.
 *
 * WHERE THE FILES LIVE
 *   Put the .glb files in `public/models/`. Next.js serves `public/` at the
 *   site root, so `public/models/house.glb` is fetched at runtime from
 *   `/models/house.glb` by the GLTFLoader (see `modelCache.ts`).
 *
 *   To add or rename a model: drop the .glb in `public/models/` and either name
 *   it to match the path below, or edit the path here to match your filename.
 * ============================================================================= */

/** Every model the game can load, keyed by role. */
export type ModelKey =
  | "house" // the protected building (SRS FR-6)
  | "fence" // perimeter fence segment (SRS FR-5)
  | "enemyEasy" // 100 HP, fastest   (SRS FR-8)
  | "enemyMedium" // 200 HP, medium  (SRS FR-8)
  | "enemyHard" // 400 HP, slowest   (SRS FR-8)
  | "weaponBasic" // starting cannon (SRS FR-12)
  | "weaponMedium" // wave-2 unlock  (SRS FR-13)
  | "weaponAdvanced"; // wave-3 unlock (SRS FR-14)

/** key → public URL. Paths are relative to the site root (the `public/` dir). */
export const MODEL_PATHS: Record<ModelKey, string> = {
  house: "/models/house.glb",
  fence: "/models/fence.glb",
  enemyEasy: "/models/enemy-easy.glb",
  enemyMedium: "/models/enemy-medium.glb",
  enemyHard: "/models/enemy-hard.glb",
  weaponBasic: "/models/weapon-basic.glb",
  weaponMedium: "/models/weapon-medium.glb",
  weaponAdvanced: "/models/weapon-advanced.glb",
};

/** All keys, handy for preloading everything at once. */
export const MODEL_KEYS = Object.keys(MODEL_PATHS) as ModelKey[];
