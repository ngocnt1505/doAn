/* =============================================================================
 * src/systems/renderSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Mirrors enemy DATA onto Three.js OBJECTS, including animation. Impure
 *   (owns the id→view map + AnimationMixers), so it's a stateful renderer.
 *
 * MILESTONE 8 — Animation.
 *   - MOVING enemy → loop the WALK clip while it advances.
 *   - DEAD enemy   → play the FALL/DEATH clip ONCE in place, then signal the
 *     game to remove it (`onExpired(id)` → REMOVE_ENEMY). So a dead enemy lingers
 *     in state just long enough to finish its death animation.
 *
 *   Clips are selected by NAME (these rigs ship many actions; clip[0] is a
 *   Death/Crawl pose). Model is the RAW cloned GLB at native scale — animating
 *   the skeleton is bind-safe (only scaling/rotating the rig collapses it).
 * ============================================================================= */

import * as THREE from "three";
import type { Bullet, Enemy, EnemyType, TargetMarker } from "@/types/entity";
import type { ModelKey } from "@/lib/models";
import { getAnimations, getModel, hasModel } from "@/lib/modelCache";

/** Each enemy type renders with its own GLB (skeleton / zombie / big-arm — see
 *  the GLB asset mapping). Clips are still selected by NAME per model. */
const MODEL_BY_TYPE: Record<EnemyType, ModelKey> = {
  easy: "enemyEasy",
  medium: "enemyMedium",
  hard: "enemyHard",
};
const WALK_CLIP = /walk/i;
const DEATH_CLIP = /death|die|fall/i;

/** Yaw so a model faces the house it walks toward (-x). A rigid rotation is
 *  bind-safe (the walk/fall animation already rotates the same bones). If a
 *  given model faces the wrong way, this can be split per type. */
const ENEMY_FACING_Y = -Math.PI / 2;

/** Uniform scale per type (1 = native). The three rigs have different native
 *  sizes, so this is per-type to keep them visually comparable. A direct uniform
 *  scale is bind-safe; only `scaleToExtent`-style measuring collapsed them. */
const ENEMY_SCALE: Record<EnemyType, number> = {
  easy: 2,
  medium: 2,
  hard: 2,
};

interface EnemyView {
  root: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  walk?: THREE.AnimationAction;
  deathClip?: THREE.AnimationClip;
  /** True once the fall animation has started (enemy is DEAD). */
  dying: boolean;
  /** Seconds of fall animation left before we ask the game to remove it. */
  deathRemaining: number;
}

export interface EnemyRenderer {
  /** Reconcile meshes with state and advance animations by `dt`. */
  sync: (enemies: Enemy[], dt: number) => void;
  /** Remove and dispose every enemy object. Call on unmount. */
  dispose: () => void;
}

/** `onExpired(id)` is called once a dead enemy's fall animation has finished, so
 *  the caller can remove it from game state. */
export function createEnemyRenderer(
  scene: THREE.Scene,
  onExpired: (id: string) => void,
): EnemyRenderer {
  const views = new Map<string, EnemyView>();

  function createView(enemy: Enemy): EnemyView {
    const key = MODEL_BY_TYPE[enemy.type];
    if (hasModel(key)) {
      const model = getModel(key);
      model.rotation.y = ENEMY_FACING_Y; // face the house (-x)
      model.scale.setScalar(ENEMY_SCALE[enemy.type]);
      model.traverse((o) => {
        o.frustumCulled = false; // skinned meshes get wrongly culled otherwise
      });
      scene.add(model);

      const clips = getAnimations(key);
      const view: EnemyView = {
        root: model,
        deathClip: clips.find((c) => DEATH_CLIP.test(c.name)),
        dying: false,
        deathRemaining: 0,
      };
      if (clips.length > 0) {
        view.mixer = new THREE.AnimationMixer(model);
        const walkClip = clips.find((c) => WALK_CLIP.test(c.name));
        if (walkClip) {
          view.walk = view.mixer.clipAction(walkClip);
          view.walk.play();
        }
      }
      return view;
    }

    // Fallback cube if the GLB failed to load (no animation; expires at once).
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xff3344, roughness: 0.6 }),
    );
    cube.position.y = 1;
    cube.castShadow = true;
    scene.add(cube);
    return { root: cube, dying: false, deathRemaining: 0 };
  }

  /** Switch a view to its death animation (or mark it for instant removal). */
  function startDeath(view: EnemyView): void {
    view.dying = true;
    if (view.mixer && view.deathClip) {
      view.walk?.fadeOut(0.15);
      const action = view.mixer.clipAction(view.deathClip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true; // hold the final fallen pose
      action.fadeIn(0.15).play();
      view.deathRemaining = view.deathClip.duration;
    } else {
      view.deathRemaining = 0; // no death clip → remove on the next frame
    }
  }

  function disposeView(view: EnemyView): void {
    view.mixer?.stopAllAction();
    scene.remove(view.root);
    view.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mat = o.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }

  return {
    sync(enemies, dt) {
      const live = new Set<string>();

      for (const enemy of enemies) {
        live.add(enemy.id);
        let view = views.get(enemy.id);
        if (!view) {
          view = createView(enemy);
          views.set(enemy.id, view);
        }

        if (enemy.state === "dead") {
          if (!view.dying) startDeath(view); // walk → fall
          view.mixer?.update(dt);
          view.deathRemaining -= dt;
          if (view.deathRemaining <= 0) onExpired(enemy.id); // ready to remove
        } else {
          // Alive: follow position and keep the walk cycle running.
          view.root.position.set(enemy.pos.x, 0, enemy.pos.z);
          view.mixer?.update(dt);
        }
      }

      // Reap views whose enemy left state (removed after its fall animation).
      for (const [id, view] of views) {
        if (!live.has(id)) {
          disposeView(view);
          views.delete(id);
        }
      }
    },

    dispose() {
      for (const view of views.values()) disposeView(view);
      views.clear();
    },
  };
}

/* =============================================================================
 * Phase 5 · Milestone 3 — Target Marker (renderer).
 *   Mirrors `state.marker` onto a single on-ground "X" (SRS FR-15 step 6). One
 *   reusable object: shown + repositioned when a marker exists, hidden when not.
 * ============================================================================= */

/** Slightly above the floor planes so the X never z-fights with the ground. */
const MARKER_Y = 0.06;
/** Half-length of each arm of the X, in world units. */
const MARKER_ARM = 1.4;
/** Thickness of the X's bars. */
const MARKER_BAR = 0.28;
const MARKER_COLOR = 0xff3b3b;

export interface TargetMarkerRenderer {
  /** Show/move the X to `marker`, or hide it when `marker` is null. */
  sync: (marker: TargetMarker | null) => void;
  /** Remove and dispose the marker object. Call on unmount. */
  dispose: () => void;
}

/** Build a flat red "X" (two crossed bars lying on the XZ plane). */
function buildMarkerMesh(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
  // Bars run along x; rotating ±45° about y crosses them into an X on the ground.
  for (const yaw of [Math.PI / 4, -Math.PI / 4]) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(MARKER_ARM * 2, MARKER_BAR, MARKER_BAR),
      material,
    );
    bar.rotation.y = yaw;
    group.add(bar);
  }
  return group;
}

export function createTargetMarkerRenderer(
  scene: THREE.Scene,
): TargetMarkerRenderer {
  const marker = buildMarkerMesh();
  marker.visible = false; // nothing to show until the first click
  scene.add(marker);

  return {
    sync(target) {
      if (!target) {
        marker.visible = false;
        return;
      }
      marker.visible = true;
      marker.position.set(target.pos.x, MARKER_Y, target.pos.z);
    },
    dispose() {
      scene.remove(marker);
      marker.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    },
  };
}

/* =============================================================================
 * Phase 5 · Milestone 6 — Bullet rendering.
 *   Mirrors `state.bullets` onto cannonball meshes (one per id). Each frame: add
 *   a sphere for any new bullet, move every sphere to its bullet's position, and
 *   reap spheres whose bullet left state. No animation/movement here — bullets
 *   hold still until the trajectory milestone advances their position.
 * ============================================================================= */

/** Cannonball radius, world units. */
const BULLET_RADIUS = 0.4;
const BULLET_COLOR = 0x222428;

export interface BulletRenderer {
  /** Reconcile cannonball meshes with the current bullets. */
  sync: (bullets: Bullet[]) => void;
  /** Remove and dispose every bullet mesh. Call on unmount. */
  dispose: () => void;
}

/** A dark metallic sphere — the cannonball. */
function buildBulletMesh(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BULLET_RADIUS, 16, 16),
    new THREE.MeshStandardMaterial({
      color: BULLET_COLOR,
      roughness: 0.35,
      metalness: 0.7,
    }),
  );
  mesh.castShadow = true;
  return mesh;
}

export function createBulletRenderer(scene: THREE.Scene): BulletRenderer {
  const meshes = new Map<string, THREE.Mesh>();

  function disposeMesh(mesh: THREE.Mesh): void {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }

  return {
    sync(bullets) {
      const live = new Set<string>();
      for (const bullet of bullets) {
        live.add(bullet.id);
        let mesh = meshes.get(bullet.id);
        if (!mesh) {
          mesh = buildBulletMesh();
          scene.add(mesh);
          meshes.set(bullet.id, mesh);
        }
        mesh.position.set(bullet.position.x, bullet.position.y, bullet.position.z);
      }
      for (const [id, mesh] of meshes) {
        if (!live.has(id)) {
          disposeMesh(mesh);
          meshes.delete(id);
        }
      }
    },
    dispose() {
      for (const mesh of meshes.values()) disposeMesh(mesh);
      meshes.clear();
    },
  };
}
