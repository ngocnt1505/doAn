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
import { BLAST_RADIUS, TOTAL_WAVES, WAVE_CLEAR_DELAY } from "@/core/constants";

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
    let markerRenderer: TargetMarkerRenderer | null = null;
    let bulletRenderer: BulletRenderer | null = null;
    let weaponRenderer: WeaponRenderer | null = null;
    let detachClick: (() => void) | null = null;

    // M4/M5 — a click broadcasts a `shoot:requested` event; on it we FIRE_SHOT,
    // which builds the active weapon's projectile(s) at the muzzle (with its
    // damage / Big Shot / flight time) and the movement system flies them.
    const bus = createEventBus();
    const unsubShoot = bus.on("shoot:requested", ({ target }) => {
      store.dispatch({ type: "FIRE_SHOT", target: { x: target.x, z: target.z } });
    });
    const shootController = createShootController(bus);

    // Phase 6 — Combat Pipeline: when a bullet lands, spread its damage over
    // nearby enemies as area-of-effect falloff (SRS FR-19 / FR-38) and dispatch
    // one DAMAGE_ENEMY per hit. The reducer clamps health, marks an enemy "dead"
    // at 0 HP, and the renderer plays its fall before it's removed. `impacted`
    // guards against re-resolving the blast on later frames while the bullet
    // lingers (SRS BR-122: impact processing runs once per projectile).
    const impacted = new Set<string>();
    const unsubImpact = bus.on("bullet:impact", ({ x, z, damage }) => {
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

    // M1 — Mouse Position Detection: tracks the cursor's position over the canvas
    // (available via mouseInput.getPosition()). The per-move console readout is
    // off now that M2+ use the click position directly.
    const mouseInput = createMouseInputSystem();
    mouseInput.attach(canvas);

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

      // Raycast + marker + shoot: on left-click, cast the cursor onto the ground
      // plane; if it hits and is inside the yard, issue a shoot request on the bus
      // (→ FIRE_SHOT, which drops the "X" marker and fires the active weapon).
      const picker = createGroundPicker(ctx.camera);
      markerRenderer = createTargetMarkerRenderer(ctx.scene);
      bulletRenderer = createBulletRenderer(ctx.scene);
      // Owns the three cannon models; shows the active weapon's, hides the rest.
      weaponRenderer = createWeaponRenderer(ctx.scene);
      const handleClick = (event: PointerEvent) => {
        const c = canvasRef.current;
        if (event.button !== 0 || !c) return; // left button only (SRS FR-15)
        const rect = c.getBoundingClientRect();
        const hit = picker.pickGround(
          event.clientX - rect.left,
          event.clientY - rect.top,
          rect.width,
          rect.height,
        );
        if (!hit) return; // ray missed the ground plane
        const target = { x: hit.x, z: hit.z };
        // Yard restriction (SRS FR-7 / BR-14/15/50/51): only clicks inside the
        // green yard are valid — outside it, no marker and no shot.
        if (!isInsideYard(target)) return;
        // FIRE_SHOT (via the bus) drops the "X" marker AND builds the weapon's
        // projectile(s) in one step, so no separate SET_TARGET is needed.
        shootController.requestShoot(target); // M4: shoot event → FIRE_SHOT
      };
      const clickTarget = canvasRef.current;
      clickTarget.addEventListener("pointerdown", handleClick);
      detachClick = () =>
        clickTarget.removeEventListener("pointerdown", handleClick);

      // FR-21/FR-22: schedules the current wave's enemies (per-type intervals,
      // sequential, first ~3s after "Ready", stops when the roster is created).
      // Spawning freezes when the game isn't Playing.
      const enemyManager = createEnemyManager(store);
      const spawnScheduler = createSpawnScheduler(enemyManager);

      // Counts down once a wave's field is clear; null when no clear is pending.
      // The wave is only declared cleared after this grace period (WAVE_CLEAR_DELAY).
      let waveClearTimer: number | null = null;

      loop = createGameLoop((dt) => {
        store.dispatch({ type: "TICK", dt });

        const s = store.getState();
        const playing = s.status === "playing";

        // All gameplay updates run only while Playing (SRS FR-26 / BR-96): spawn
        // scheduling, movement, and bullet flight freeze on Pause / win / lose.
        spawnScheduler.update(dt, s.wave, s.status); // pause-safe internally
        store.dispatch({ type: "MOVE_ENEMIES", dt }); // reducer gates to Playing
        store.dispatch({ type: "MOVE_BULLETS", dt }); // arc toward target (M7/M8)

        // Impact Detection (SRS FR-37): the first frame a bullet reaches its
        // target, broadcast the impact (once) so the combat pipeline applies
        // area-of-effect damage, and hide the "X" immediately. The bullet itself
        // is destroyed by the movement system 1 s later (the linger).
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
            });
            store.dispatch({ type: "CLEAR_TARGET" }); // X disappears on arrival
          }
        }
        for (const id of impacted) if (!liveBullets.has(id)) impacted.delete(id);

        // Wave completion (SRS FR-23): while Playing, once the whole roster has
        // spawned (BR-84) and no enemies remain, the field is clear. We then wait
        // WAVE_CLEAR_DELAY (3s after the last monster dies) before declaring the
        // wave cleared — Wave 3 → victory (FR-31); earlier waves → reward overlay
        // + transition (FR-24/25). The game stays Playing during the wait so
        // bullets/animations finish; pausing cancels the countdown.
        const w = store.getState();
        const fieldClear =
          w.status === "playing" &&
          w.enemies.length === 0 &&
          spawnScheduler.isRosterComplete(w.wave);
        if (fieldClear) {
          waveClearTimer = waveClearTimer === null ? WAVE_CLEAR_DELAY : waveClearTimer - dt;
          if (waveClearTimer <= 0) {
            waveClearTimer = null;
            store.dispatch(
              w.wave >= TOTAL_WAVES ? { type: "WIN" } : { type: "WAVE_CLEARED" },
            );
          }
        } else {
          waveClearTimer = null;
        }

        // Render every frame so the scene + overlays stay drawn (BR-98), but feed
        // the renderer dt = 0 when not Playing so animations / death timers freeze.
        enemyRenderer?.sync(store.getState().enemies, playing ? dt : 0);
        // The "X" target follows state.marker; always synced so it stays put
        // regardless of pause/win/lose (it's a UI cue, not a simulated entity).
        markerRenderer?.sync(store.getState().marker);
        // Bullets render every frame too; they hold still until trajectory (later).
        bulletRenderer?.sync(store.getState().bullets);
        // Show the active weapon's cannon (swaps instantly on progression).
        weaponRenderer?.sync(store.getState().weapon);
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
      ctx?.dispose();
    };
  }, [store]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
