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
import { preloadModels } from "@/lib/modelCache";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useMouse } from "@/hooks/useMouse";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<ThreeContext | null>(null);

  // Preload every .glb, THEN build the Three.js context. Loading first means
  // the cannon, house, fences and monsters can all clone their model
  // synchronously — no per-spawn fetch, no placeholder pop-in.
  useEffect(() => {
    if (!canvasRef.current) return;
    let context: ThreeContext | null = null;
    let cancelled = false;

    preloadModels().then(() => {
      if (cancelled || !canvasRef.current) return;
      context = createThreeContext(canvasRef.current);
      setCtx(context);
    });

    return () => {
      cancelled = true;
      context?.dispose();
    };
  }, []);

  // Start the loop once the context exists.
  useGameLoop(ctx);

  // Mouse → fire-at-target. Needs ctx for the camera + ground raycast.
  useMouse(ctx);

  // Keyboard handles lifecycle shortcuts (ESC = pause). No movement keys.
  useKeyboard();

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="Game canvas"
    />
  );
}
