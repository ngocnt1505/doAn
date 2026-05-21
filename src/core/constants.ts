/* =============================================================================
 * src/core/constants.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A single home for magic numbers that govern the simulation: speeds,
 *   cooldowns, world size, max entities, etc.
 *
 * WHY IT EXISTS
 *   Game-design tweaks (the "feel" of the game) come down to changing
 *   numbers. Centralising them here means a designer or thesis reviewer can
 *   adjust gameplay without grepping the codebase. It also gives systems a
 *   shared vocabulary for tuning.
 *
 * WHAT BELONGS HERE
 *   - Immutable tuning values used across multiple systems
 *   - Identifiers for "well-known" things (e.g. player entity id)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Runtime state (use the store)
 *   - Three.js objects (use `src/lib/threeSetup.ts`)
 *   - One-off values used by a single file (keep them local)
 * ============================================================================= */

/* ---------- Time ---------- */
/** Soft cap on delta-time to keep the simulation stable on slow frames. */
export const MAX_DELTA_MS = 1000 / 30; // = 33.3ms (i.e. clamp below 30 FPS)

/* ---------- World ---------- */
export const WORLD_HALF_SIZE = 25; // meters from origin to edge in X/Z

/* ---------- Player ---------- */
export const PLAYER_ID = "player-1";
export const PLAYER_SPEED = 6;       // m/s
export const PLAYER_FIRE_COOLDOWN_MS = 250;
export const PLAYER_MAX_HEALTH = 100;

/* ---------- Bullets ---------- */
export const BULLET_SPEED = 20;      // m/s
export const BULLET_LIFETIME_MS = 1500;

/* ---------- Enemies ---------- */
export const ENEMY_BASE_SPEED = 2;   // m/s
export const ENEMY_BASE_HEALTH = 30;
export const ENEMY_SCORE_VALUE = 10;

/* ---------- Waves ---------- */
export const WAVE_INTERVAL_MS = 8000; // ms between waves
export const WAVE_BASE_COUNT = 3;     // enemies in wave 1
