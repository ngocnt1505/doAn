// Turns a clicked target into a shot request. A click broadcasts a
// `shoot:requested` event on the event bus; a handler turns it into a FIRE_SHOT.

import type { EventBus } from "@/core/eventBus";
import type { GroundPos } from "@/types/entity";
import { SPAWN_X, YARD_HALF_DEPTH, YARD_START_X } from "@/core/constants";

// Is a ground point inside the green monster yard? Only the yard is a valid
// target; clicks outside it are ignored.
export function isInsideYard(p: GroundPos): boolean {
  return (
    p.x >= YARD_START_X &&
    p.x <= SPAWN_X &&
    Math.abs(p.z) <= YARD_HALF_DEPTH
  );
}

export interface ShootController {
  requestShoot: (target: GroundPos) => void;
}

export function createShootController(bus: EventBus): ShootController {
  return {
    requestShoot(target) {
      bus.emit("shoot:requested", { target });
    },
  };
}
