// Tracks the cursor position on the game surface, in CSS pixels relative to the
// canvas. First link in the shooting chain (later turned into a world target).

// Cursor position in CSS pixels, relative to the target element's top-left.
export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseInputSystem {
  attach: (target: HTMLElement) => void;
  detach: () => void;
  getPosition: () => MousePosition;
}

export function createMouseInputSystem(
  onMove?: (pos: MousePosition) => void,
): MouseInputSystem {
  const position: MousePosition = { x: 0, y: 0 };
  let element: HTMLElement | null = null;

  // Convert viewport coordinates to canvas-relative coordinates.
  const handleMove = (event: PointerEvent) => {
    if (!element) return;
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
