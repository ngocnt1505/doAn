/* =============================================================================
 * src/systems/mouseInputSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 1 — Mouse Position Detection.
 *   Read the cursor's position on the game surface. This is the very first link
 *   in the shooting chain (SRS FR-15 "the player presses the left mouse button"):
 *   later milestones turn this 2D screen point into a world target (raycast),
 *   then into a marker and a projectile. For now it does ONE thing — track where
 *   the mouse is, in screen (CSS-pixel) coordinates relative to the canvas.
 *
 * SCOPE (Milestone 1)
 *   - Listen for pointer movement over a target element.
 *   - Expose the latest x,y and notify a callback on every move.
 *
 * NOT YET (later milestones)
 *   - Raycasting to the ground (M2 · raycasting.ts)
 *   - Target marker, projectile, bullet
 * ============================================================================= */

/** Cursor position in CSS pixels, relative to the target element's top-left. */
export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseInputSystem {
  /** Begin listening for pointer movement over `target`. */
  attach: (target: HTMLElement) => void;
  /** Stop listening and release the handler. Safe to call if not attached. */
  detach: () => void;
  /** The latest known cursor position (relative to the attached element). */
  getPosition: () => MousePosition;
}

/**
 * Create the mouse-input system. `onMove` (optional) fires on every movement
 * with the new position — Milestone 1 wires this to a console readout so we can
 * verify the coordinates update as the mouse moves.
 */
export function createMouseInputSystem(
  onMove?: (pos: MousePosition) => void,
): MouseInputSystem {
  const position: MousePosition = { x: 0, y: 0 };
  let element: HTMLElement | null = null;

  const handleMove = (event: PointerEvent) => {
    if (!element) return;
    // Convert from viewport coordinates to coordinates relative to the canvas,
    // so x,y describe where the cursor is ON the game surface (0,0 = top-left).
    const rect = element.getBoundingClientRect();
    position.x = event.clientX - rect.left;
    position.y = event.clientY - rect.top;
    onMove?.(position);
  };

  return {
    attach(target) {
      this.detach();
      element = target;
      element.addEventListener("pointermove", handleMove);
    },
    detach() {
      if (!element) return;
      element.removeEventListener("pointermove", handleMove);
      element = null;
    },
    getPosition() {
      return position;
    },
  };
}
