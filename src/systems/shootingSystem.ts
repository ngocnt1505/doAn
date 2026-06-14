/* =============================================================================
 * src/systems/shootingSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Convert click-to-target requests from the mouse hook into bullet
 *   entities, computing the initial velocity so the projectile follows a
 *   parabolic arc and lands on the clicked point.
 *
 * WHY IT EXISTS
 *   This is the canonical "input → state" showcase for the architecture:
 *   the mouse hook does no game logic — it just pushes a target point. This
 *   system reads that queue, applies the cooldown, solves the projectile
 *   math, and dispatches the resulting bullet. Three.js is never touched.
 *
 * --- Projectile math ----------------------------------------------------------
 *   Given:
 *     - cannon muzzle position P = (Px, Py, Pz)
 *     - target point          T = (Tx, 0,  Tz)        (on the ground)
 *     - desired flight time   t (seconds)
 *     - gravity               g (m/s^2, positive downward)
 *
 *   Constant-acceleration kinematics in each axis:
 *     T.x = P.x + vx * t              →  vx = (T.x - P.x) / t
 *     T.z = P.z + vz * t              →  vz = (T.z - P.z) / t
 *     T.y = P.y + vy * t - 0.5 g t^2  →  vy = (T.y - P.y + 0.5 g t^2) / t
 *
 *   The flight time is fixed (`BULLET_FLIGHT_MS`), so every shot takes the
 *   same time to land — predictable feel, easy to read on screen.
 * ----------------------------------------------------------------------------- */

import { dispatch, getState } from "@/core/gameStore";
import {
  BULLET_FLIGHT_MS,
  CANNON_MUZZLE_HEIGHT,
  GRAVITY,
  PLAYER_FIRE_COOLDOWN_MS,
} from "@/core/constants";
import { createBulletEntity } from "@/entities/Bullet";
import type { PlayerEntity, Vec3 } from "@/types/entity";

/* -------------------------------------------------------------------------- */
/* Fire-request queue                                                         */
/*                                                                            */
/* The mouse hook pushes target points here; the system drains the queue      */
/* every tick. Using a module-level queue (rather than a reducer action) keeps */
/* per-frame intent out of the action log, matching the spawn system.         */
/* -------------------------------------------------------------------------- */

const fireQueue: Vec3[] = [];

/** Public API for input hooks: "the user wants to fire at this point". */
export function requestFire(target: Vec3): void {
  fireQueue.push(target);
}

/** Reset queue state on RESET (called by the hook that owns lifecycle). */
export function resetFireQueue(): void {
  fireQueue.length = 0;
}

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export function shootingSystem(_dt: number): void {
  if (fireQueue.length === 0) return;

  const state = getState();
  const player = state.entities.find(
    (e): e is PlayerEntity => e.kind === "player",
  );
  if (!player || player.dead) {
    fireQueue.length = 0; // discard intents if there's no shooter
    return;
  }

  // We only honour the most recent click per tick — and only if the cooldown
  // has expired. Older queued targets are dropped so a button-mashed player
  // doesn't build up a backlog of shots that fire after they stop clicking.
  const target = fireQueue[fireQueue.length - 1];
  fireQueue.length = 0;

  if (state.elapsedMs - player.lastShotAt < PLAYER_FIRE_COOLDOWN_MS) {
    // Still on cooldown — record the aim so the barrel tracks the cursor,
    // but skip the shot itself.
    dispatch({
      type: "REPLACE_ENTITIES",
      entities: state.entities.map((e) =>
        e.kind === "player" ? { ...e, aimTarget: target } : e,
      ),
    });
    return;
  }

  // Muzzle position = cannon position lifted to barrel height.
  const muzzle: Vec3 = [
    player.position[0],
    player.position[1] + CANNON_MUZZLE_HEIGHT,
    player.position[2],
  ];

  const t = BULLET_FLIGHT_MS / 1000;
  const vx = (target[0] - muzzle[0]) / t;
  const vz = (target[2] - muzzle[2]) / t;
  const vy = (target[1] - muzzle[1] + 0.5 * GRAVITY * t * t) / t;
  const velocity: Vec3 = [vx, vy, vz];

  const bullet = createBulletEntity(player.id, muzzle, velocity);

  dispatch({ type: "SPAWN", entity: bullet });
  dispatch({
    type: "REPLACE_ENTITIES",
    entities: getState().entities.map((e) =>
      e.kind === "player"
        ? { ...e, lastShotAt: state.elapsedMs, aimTarget: target }
        : e,
    ),
  });
}
