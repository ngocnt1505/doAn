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
/** Half-extent of the playable yard along the x-axis (the action axis).
 *  Enemies spawn near the right edge and march toward the cannon on the left. */
export const WORLD_HALF_SIZE = 14; // shorter yard; freed left strip holds the house
/** Half-extent of the yard along z. The yard is a rectangle, narrower in z than x. */
export const YARD_HALF_DEPTH = 12;
/** Centre of the yard along x. The yard is RIGHT-ALIGNED in the world so the
 *  open strip on the left can hold scenery (the house). Everything that
 *  draws the yard — ground, grid, fence, spawn line, camera target — adds
 *  this offset. */
export const YARD_CENTER_X = 8;

/** Where the (decorative) house sits — in the open strip to the LEFT of the
 *  yard. Anything in `src/lib/threeSetup.ts` reads this. */
export const HOUSE_POSITION: readonly [number, number, number] = [-14, 0, 0];

/** Downward acceleration applied to projectiles. m/s^2. */
export const GRAVITY = 9.81;

/* ---------- Cannon (player) ---------- */
export const PLAYER_ID = "player-1";
export const PLAYER_FIRE_COOLDOWN_MS = 350;
export const PLAYER_MAX_HEALTH = 100;

/** Where the cannon sits on the yard. Parked on the LEFT side, aimed right —
 *  enemies advance from the +x end, the camera watches from the side (+z).
 *  Sits a touch inside the yard's left edge (YARD_CENTER_X - WORLD_HALF_SIZE). */
export const CANNON_POSITION: readonly [number, number, number] = [-4, 0, 0];
/** Vertical offset of the muzzle above the cannon's ground position. */
export const CANNON_MUZZLE_HEIGHT = 1.0;

/* ---------- Bullets ---------- */
/** Fixed time-of-flight for every shot. Bullet is guaranteed to land on the
 *  clicked target after this many ms (modulo gravity integration error). */
export const BULLET_FLIGHT_MS = 1500;
/** Safety net: despawn a bullet that somehow outlives the flight time. */
export const BULLET_LIFETIME_MS = 3000;

/* ---------- Enemies ---------- */
/** Default fallback stats. Per-variant numbers below override these. */
export const ENEMY_BASE_SPEED = 2;   // m/s
export const ENEMY_BASE_HEALTH = 30;
export const ENEMY_SCORE_VALUE = 10;

/** How long an enemy lingers in "dying" state before cleanup removes it.
 *  Long enough to read the topple animation, short enough to feel snappy. */
export const ENEMY_DEATH_MS = 450;

/** Per-variant tuning. Adding a new monster type? Add a row here, the
 *  mesh factory in `src/entities/Enemy.ts`, and that's it. */
export const ENEMY_STATS = {
  /** Cheap fast cannon-fodder. Dies in one hit. */
  grunt:   { speed: 3.2, health: 15, score: 5,  scale: 0.85 },
  /** Slow tank — soaks several hits, worth more points. */
  brute:   { speed: 1.1, health: 80, score: 25, scale: 1.35 },
  /** Medium speed, medium health — the "default" foe. */
  stalker: { speed: 2.2, health: 35, score: 10, scale: 1.0  },
} as const;

/* ---------- Waves (reserved for later, not used in MVP) ---------- */
export const WAVE_INTERVAL_MS = 8000; // ms between waves
export const WAVE_BASE_COUNT = 3;     // enemies in wave 1
