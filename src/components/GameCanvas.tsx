"use client";

/* =============================================================================
 * src/components/GameCanvas.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The single bridge between React and the game. It owns the <canvas>, builds
 *   the Three.js context and the game store once on mount, then runs the game
 *   loop: each frame it dispatches TICK (advancing reducer-managed timers) and
 *   renders the scene. Everything is torn down on unmount.
 *
 *   Input → Dispatch → Reducer → Update State → Run Systems → Render Scene
 *
 * WHY IT EXISTS
 *   This is the THIN BRIDGE: the only React component that knows Three.js
 *   exists. Systems (movement, spawning, collision…) will be invoked from the
 *   frame callback in later phases, reading the latest state from the store.
 *
 * WHAT DOES NOT BELONG HERE
 *   - Gameplay logic, HUD/overlay JSX (separate components)
 *   - Manual scene editing
 * ============================================================================= */

import { useEffect, useRef } from "react";
import { createThreeContext, type ThreeContext } from "@/lib/threeSetup";
import { preloadModels } from "@/lib/modelCache";
import { createStore } from "@/core/gameStore";
import { createGameLoop, type GameLoop } from "@/core/gameLoop";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let ctx: ThreeContext | null = null;
    let loop: GameLoop | null = null;
    let observer: ResizeObserver | null = null;

    // Load every .glb first so scenery (and later, entities) can clone from the
    // cache synchronously — no per-spawn fetch, no model pop-in.
    preloadModels().then(() => {
      if (cancelled || !canvasRef.current) return;

      ctx = createThreeContext(canvasRef.current);
      const store = createStore();

      const resizeToParent = () => {
        const parent = canvasRef.current?.parentElement;
        if (!parent || !ctx) return;
        ctx.resize(parent.clientWidth, parent.clientHeight);
      };
      resizeToParent();

      observer = new ResizeObserver(resizeToParent);
      if (canvasRef.current.parentElement) {
        observer.observe(canvasRef.current.parentElement);
      }

      loop = createGameLoop((dt) => {
        // 1. Advance state. 2. (Systems run here in later phases.) 3. Render.
        store.dispatch({ type: "TICK", dt });
        ctx?.render();
      });
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
      observer?.disconnect();
      ctx?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
