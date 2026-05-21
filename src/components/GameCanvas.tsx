/* =============================================================================
 * src/components/GameCanvas.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Owns the <canvas> element, creates the Three.js context on mount,
 *   starts the game loop, attaches input listeners, and tears everything
 *   down cleanly on unmount.
 *
 * WHY IT EXISTS
 *   This is the THIN BRIDGE between React and the rest of the architecture.
 *   It is the only React component that knows Three.js exists.
 *
 * WHAT BELONGS HERE
 *   - The <canvas> JSX
 *   - useEffect that builds `ThreeContext` and starts the loop
 *   - Hook wiring (`useGameLoop`, `useKeyboard`)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Gameplay logic
 *   - HUD or overlay JSX (separate components)
 *   - Manual scene editing
 * ============================================================================= */

"use client";

import { useEffect, useRef, useState } from "react";
import { createThreeContext, type ThreeContext } from "@/lib/threeSetup";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboard } from "@/hooks/useKeyboard";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<ThreeContext | null>(null);

  // Build the Three.js context once the canvas is mounted in the DOM.
  useEffect(() => {
    if (!canvasRef.current) return;
    const next = createThreeContext(canvasRef.current);
    setCtx(next);
    return () => next.dispose();
  }, []);

  // Start the loop once the context exists.
  useGameLoop(ctx);

  // Forward keyboard → store. Independent of the canvas itself.
  useKeyboard();

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="Game canvas"
    />
  );
}
