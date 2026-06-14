/* =============================================================================
 * src/hooks/useMouse.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Translate pointer clicks on the canvas into world-space target points,
 *   then push those points onto the shooting system's fire-request queue.
 *
 * WHY IT EXISTS
 *   Mouse-to-world picking needs the camera, the canvas, and a raycast
 *   target — all of which live in `ThreeContext`. Keeping the wiring in a
 *   hook means the input source can be swapped (touch, gamepad, demo replay)
 *   without changing the shooting system.
 *
 * WHAT BELONGS HERE
 *   - Pointer event listeners
 *   - Raycast call into the ground plane
 *   - Dispatching the fire intent (via `requestFire`)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Bullet creation / projectile math — that is `shootingSystem.ts`
 *   - Anything about the cannon's cooldown — same place
 * ============================================================================= */

import { useEffect } from "react";
import { pickWorldPoint } from "@/lib/raycasting";
import { getState } from "@/core/gameStore";
import { requestFire } from "@/systems/shootingSystem";
import type { ThreeContext } from "@/lib/threeSetup";
import type { Vec3 } from "@/types/entity";

export function useMouse(ctx: ThreeContext | null): void {
  useEffect(() => {
    if (!ctx) return;
    const canvas = ctx.renderer.domElement;

    const onPointerDown = (event: PointerEvent) => {
      // Only fire while the game is actively running. Otherwise clicks on
      // start/pause overlays would queue ghost shots.
      if (getState().phase !== "playing") return;
      // Left button only — leave right-click for future UI (camera, menu).
      if (event.button !== 0) return;

      const hit = pickWorldPoint(event, canvas, ctx.camera, [ctx.ground]);
      if (!hit) return;

      const target: Vec3 = [hit.x, 0, hit.z];
      requestFire(target);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [ctx]);
}
