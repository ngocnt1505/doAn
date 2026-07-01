"use client";

// The single bridge between React and the game. Owns the <canvas>, builds the
// Three.js context and wires the systems once on mount, then runs the game loop:
// each frame it dispatches TICK, runs the systems, and renders. Torn down on
// unmount. It is the only React component that knows Three.js exists.

import { useEffect, useRef } from "react";
import { createThreeContext, type ThreeContext } from "@/lib/threeSetup";
import { preloadModels } from "@/lib/modelCache";
import { useGameStore } from "@/hooks/useGameStore";
import { createGameLoop, type GameLoop } from "@/core/gameLoop";
import {
  createBulletRenderer,
  createEnemyRenderer,
  createTargetMarkerRenderer,
  createWeaponRenderer,
  type BulletRenderer,
  type EnemyRenderer,
  type TargetMarkerRenderer,
  type WeaponRenderer,
} from "@/systems/renderSystem";
import { createEnemyManager } from "@/systems/enemyManager";
import { createSpawnScheduler } from "@/systems/spawnSystem";
import { createMouseInputSystem } from "@/systems/mouseInputSystem";
import { createGroundPicker } from "@/lib/raycasting";
import { createEventBus } from "@/core/eventBus";
import { createShootController, isInsideYard } from "@/systems/shootingSystem";
import { resolveImpact } from "@/systems/collisionSystem";
import { createImpactEffects, type ImpactRenderer } from "@/entities/ImpactEffect";
import { BLAST_RADIUS } from "@/core/constants";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The store is shared with the UI, so dispatching TICK here keeps everyone in
  // sync off one source of truth.
  const store = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let ctx: ThreeContext | null = null;
    let loop: GameLoop | null = null;
    let observer: ResizeObserver | null = null;
    let enemyRenderer: EnemyRenderer | null = null;
    let markerRenderer: TargetMarkerRenderer | null = null;
    let bulletRenderer: BulletRenderer | null = null;
    let weaponRenderer: WeaponRenderer | null = null;
    let impactEffects: ImpactRenderer | null = null;
    let detachClick: (() => void) | null = null;

    // A click broadcasts `shoot:requested`; on it we FIRE_SHOT.
    const bus = createEventBus();
    const unsubShoot = bus.on("shoot:requested", ({ target }) => {
      store.dispatch({ type: "FIRE_SHOT", target: { x: target.x, z: target.z } });
    });
    const shootController = createShootController(bus);

    // When a bullet lands, spread its damage over nearby enemies and dispatch one
    // DAMAGE_ENEMY per hit. `impacted` guards against re-resolving the blast.
    const impacted = new Set<string>();
    const unsubImpact = bus.on("bullet:impact", ({ x, z, damage, big }) => {
      impactEffects?.spawn({ x, z }, big);
      const hits = resolveImpact(
        store.getState().enemies,
        { x, z },
        damage,
        BLAST_RADIUS,
      );
      for (const hit of hits) {
        store.dispatch({ type: "DAMAGE_ENEMY", id: hit.id, amount: hit.amount });
      }
    });

    // Track the cursor position over the canvas.
    const mouseInput = createMouseInputSystem();
    mouseInput.attach(canvas);

    // Load every .glb first so scenery and entities can clone synchronously.
    preloadModels().then(() => {
      if (cancelled || !canvasRef.current) return;

      ctx = createThreeContext(canvasRef.current);

      // Keep the renderer sized to its parent element.
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

      // Enemy meshes + animations; when a dead enemy finishes its fall, remove it.
      enemyRenderer = createEnemyRenderer(ctx.scene, ctx.camera, (id) =>
        store.dispatch({ type: "REMOVE_ENEMY", id }),
      );

      // Raycast + marker + shoot on left-click.
      const picker = createGroundPicker(ctx.camera);
      markerRenderer = createTargetMarkerRenderer(ctx.scene);
      bulletRenderer = createBulletRenderer(ctx.scene);
      weaponRenderer = createWeaponRenderer(ctx.scene);
      impactEffects = createImpactEffects(ctx.scene);
      const handleClick = (event: PointerEvent) => {
        const c = canvasRef.current;
        if (event.button !== 0 || !c) return; // left button only
        const rect = c.getBoundingClientRect();
        const hit = picker.pickGround(
          event.clientX - rect.left,
          event.clientY - rect.top,
          rect.width,
          rect.height,
        );
        if (!hit) return; // ray missed the ground plane
        const target = { x: hit.x, z: hit.z };
        if (!isInsideYard(target)) return; // only clicks inside the yard are valid
        shootController.requestShoot(target);
      };
      const clickTarget = canvasRef.current;
      clickTarget.addEventListener("pointerdown", handleClick);
      detachClick = () =>
        clickTarget.removeEventListener("pointerdown", handleClick);

      // Schedules the current wave's enemies; freezes when not playing.
      const enemyManager = createEnemyManager(store);
      const spawnScheduler = createSpawnScheduler(enemyManager);

      loop = createGameLoop((dt) => {
        store.dispatch({ type: "TICK", dt });

        const s = store.getState();
        const playing = s.status === "playing";

        // Gameplay updates run only while playing (the reducer gates them too).
        spawnScheduler.update(dt, s.wave, s.status);
        store.dispatch({ type: "MOVE_ENEMIES", dt });
        store.dispatch({ type: "MOVE_BULLETS", dt });

        // The first frame a bullet reaches its target, broadcast its impact once
        // and hide the "X". The bullet is removed later by the movement system.
        const bullets = store.getState().bullets;
        const liveBullets = new Set<string>();
        for (const b of bullets) {
          liveBullets.add(b.id);
          if (b.elapsed >= b.flightTime && !impacted.has(b.id)) {
            impacted.add(b.id);
            bus.emit("bullet:impact", {
              bulletId: b.id,
              x: b.target.x,
              z: b.target.z,
              damage: b.damage,
              big: b.isBigShot,
            });
            store.dispatch({ type: "CLEAR_TARGET" });
          }
        }
        for (const id of impacted) if (!liveBullets.has(id)) impacted.delete(id);

        // Render every frame so the scene stays drawn, but feed dt = 0 when not
        // playing so animations / death timers freeze.
        enemyRenderer?.sync(store.getState().enemies, playing ? dt : 0);
        markerRenderer?.sync(store.getState().marker);
        bulletRenderer?.sync(store.getState().bullets);
        weaponRenderer?.sync(store.getState().weapon);
        impactEffects?.update(playing ? dt : 0);
        ctx?.render();
      });
      loop.start();
    });

    return () => {
      cancelled = true;
      mouseInput.detach();
      detachClick?.();
      unsubShoot();
      unsubImpact();
      loop?.stop();
      observer?.disconnect();
      enemyRenderer?.dispose();
      markerRenderer?.dispose();
      bulletRenderer?.dispose();
      weaponRenderer?.dispose();
      impactEffects?.dispose();
      ctx?.dispose();
    };
  }, [store]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
