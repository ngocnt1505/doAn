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
import { useGameStore } from "@/hooks/useGameStore";
import { createGameLoop, type GameLoop } from "@/core/gameLoop";
import { createEnemyRenderer, type EnemyRenderer } from "@/systems/renderSystem";
import { createEnemyManager } from "@/systems/enemyManager";
import { createSpawnScheduler } from "@/systems/spawnSystem";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The store is owned by <GameStoreProvider>; the UI (HUD, overlays) shares it,
  // so dispatching TICK here keeps everyone in sync off one source of truth.
  const store = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let ctx: ThreeContext | null = null;
    let loop: GameLoop | null = null;
    let observer: ResizeObserver | null = null;
    let enemyRenderer: EnemyRenderer | null = null;

    // Load every .glb first so scenery (and later, entities) can clone from the
    // cache synchronously — no per-spawn fetch, no model pop-in.
    preloadModels().then(() => {
      if (cancelled || !canvasRef.current) return;

      ctx = createThreeContext(canvasRef.current);

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

      // Owns the enemy meshes + animations; reconciles them to state each frame.
      // When a dead enemy finishes its fall animation, remove it from state.
      enemyRenderer = createEnemyRenderer(ctx.scene, (id) =>
        store.dispatch({ type: "REMOVE_ENEMY", id }),
      );

      // FR-21/FR-22: schedules the current wave's enemies (per-type intervals,
      // sequential, first ~3s after "Ready", stops when the roster is created).
      // Spawning freezes when the game isn't Playing.
      const enemyManager = createEnemyManager(store);
      const spawnScheduler = createSpawnScheduler(enemyManager);

      // TEMP: drains enemy health to demo death. OFF now so the spawn schedule is
      // easy to watch (enemies persist). Flip to true to test death again; will
      // be removed once the weapon can deal damage.
      const DEBUG_AUTO_DAMAGE = false;
      const DEBUG_DPS = 50;

      loop = createGameLoop((dt) => {
        store.dispatch({ type: "TICK", dt });

        const s = store.getState();
        const playing = s.status === "playing";

        // All gameplay updates run only while Playing (SRS FR-26 / BR-96): spawn
        // scheduling, movement, and (temp) damage freeze on Pause / win / lose.
        spawnScheduler.update(dt, s.wave, s.status); // pause-safe internally
        store.dispatch({ type: "MOVE_ENEMIES", dt }); // reducer gates to Playing
        if (DEBUG_AUTO_DAMAGE && playing) {
          for (const e of store.getState().enemies) {
            store.dispatch({ type: "DAMAGE_ENEMY", id: e.id, amount: DEBUG_DPS * dt });
          }
        }

        // Render every frame so the scene + overlays stay drawn (BR-98), but feed
        // the renderer dt = 0 when not Playing so animations / death timers freeze.
        enemyRenderer?.sync(store.getState().enemies, playing ? dt : 0);
        ctx?.render();
      });
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
      observer?.disconnect();
      enemyRenderer?.dispose();
      ctx?.dispose();
    };
  }, [store]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
