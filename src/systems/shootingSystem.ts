/* =============================================================================
 * src/systems/shootingSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Turns a clicked target into a shot (SRS FR-15/FR-16).
 *
 * PHASE 5 · MILESTONE 4 — Shooting Request.
 *   A click issues a SHOOT COMMAND (`requestShoot`) which broadcasts a SHOOT
 *   EVENT (`shoot:requested`) on the event bus. Other systems can subscribe to
 *   react to it; for now a logger confirms the request. No bullet is created yet
 *   — projectile spawning is a later milestone (FR-16/FR-17).
 * ============================================================================= */

import type { EventBus } from "@/core/eventBus";
import type { GroundPos } from "@/types/entity";
import { SPAWN_X, YARD_HALF_DEPTH, YARD_START_X } from "@/core/constants";

/** Is a ground point inside the green monster yard? Only the yard is a valid
 *  target area — clicks outside it are ignored (SRS FR-7 / BR-14/15/50/51). The
 *  yard spans x ∈ [YARD_START_X, SPAWN_X] and z ∈ [-half, +half]. The weapon
 *  itself sits OUTSIDE the yard (in the gray strip), so it can never be targeted. */
export function isInsideYard(p: GroundPos): boolean {
  return (
    p.x >= YARD_START_X &&
    p.x <= SPAWN_X &&
    Math.abs(p.z) <= YARD_HALF_DEPTH
  );
}

export interface ShootController {
  /** Issue a shoot command at a ground target → broadcasts a `shoot:requested`
   *  event. (Later milestones will also spawn the projectile here.) */
  requestShoot: (target: GroundPos) => void;
}

export function createShootController(bus: EventBus): ShootController {
  return {
    requestShoot(target) {
      bus.emit("shoot:requested", { target });
    },
  };
}
