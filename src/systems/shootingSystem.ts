/* =============================================================================
 * src/systems/shootingSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Convert the player's `shoot` input into bullet entities, respecting a
 *   cooldown so holding the key doesn't flood the world with projectiles.
 *
 * WHY IT EXISTS
 *   Shooting is a great showcase for "input → state". It demonstrates how
 *   a system reads input, consults state (last-shot time), and produces
 *   new entities via the spawn pipeline — never touching Three.js.
 *
 * WHAT BELONGS HERE
 *   - Cooldown logic
 *   - Building the bullet via `createBulletEntity`
 *
 * WHAT DOES NOT BELONG HERE
 *   - Reading the raw DOM keyboard — that's `hooks/useKeyboard.ts`
 *   - Bullet movement (movementSystem) or collisions (collisionSystem)
 *   - Audio / fx — those go on the event bus
 * ============================================================================= */

import { dispatch, getState } from "@/core/gameStore";
import { PLAYER_FIRE_COOLDOWN_MS } from "@/core/constants";
import { createBulletEntity } from "@/entities/Bullet";
import type { PlayerEntity } from "@/types/entity";

export function shootingSystem(_dt: number): void {
  const state = getState();
  if (!state.input.shoot) return;

  const player = state.entities.find(
    (e): e is PlayerEntity => e.kind === "player",
  );
  if (!player || player.dead) return;

  if (state.elapsedMs - player.lastShotAt < PLAYER_FIRE_COOLDOWN_MS) return;

  // Fire straight forward (negative Z by default). A future tweak: aim toward
  // the cursor via raycasting.
  const bullet = createBulletEntity(player.id, player.position, [0, 0, -1]);

  // Two changes in one frame: stamp the player's cooldown, add the bullet.
  // Easier as two dispatches than one combined action.
  dispatch({ type: "SPAWN", entity: bullet });
  dispatch({
    type: "REPLACE_ENTITIES",
    entities: getState().entities.map((e) =>
      e.kind === "player" ? { ...e, lastShotAt: state.elapsedMs } : e,
    ),
  });

  // TODO: aim with the mouse via `pickWorldPoint()` in `src/lib/raycasting.ts`.
  // TODO: emit a "shot:fired" event on the bus so audio can react.
}
