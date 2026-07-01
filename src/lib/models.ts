// The single manifest of every 3D model the game loads. Maps a logical key to
// the URL the file is served from (under public/models/).

// Every model the game can load, keyed by role.
export type ModelKey =
  | "house"
  | "fence"
  | "enemyEasy"
  | "enemyMedium"
  | "enemyHard"
  | "weaponBasic"
  | "weaponMedium"
  | "weaponAdvanced";

// key → public URL (relative to the site root, i.e. the public/ dir).
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

// All keys, handy for preloading everything at once.
export const MODEL_KEYS = Object.keys(MODEL_PATHS) as ModelKey[];
