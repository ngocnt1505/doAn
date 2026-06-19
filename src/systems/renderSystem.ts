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
import type { Bullet, Enemy, EnemyType, TargetMarker, WeaponLevel } from "@/types/entity";
import type { ModelKey } from "@/lib/models";
import { getAnimations, getModel, hasModel } from "@/lib/modelCache";
import { centerOnGround, scaleToExtent } from "@/lib/helpers";
import { WEAPON_WIDTH, WEAPON_X } from "@/core/constants";
import { WEAPONS, WEAPON_ORDER } from "@/core/weapons";
import { createHealthBar, type HealthBar } from "@/entities/HealthBar";

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
  hard: 3, // "big-arm" — QA wants it twice the size of the others
};

/** World Y to float each type's health bar at — tuned to sit just above the
 *  VISIBLE head (the rigs' measured bounding boxes are far taller than the model,
 *  so we use fixed values instead). Raise/lower these to move the bar. */
const BAR_HEAD_Y: Record<EnemyType, number> = {
  easy: 4,
  medium: 4,
  hard: 5, // bigger model → a bit higher
};

/* Hit feedback (SRS FR-40 / BR-134..137): when an enemy loses health, it briefly
 * glows red so the player can see the shot connected, then fades back. */
const HIT_FLASH_TIME = 0.22; // seconds the glow lasts
const HIT_FLASH_COLOR = 0xff2a2a;
const HIT_FLASH_MAX = 0.95; // peak emissive intensity

/** A per-instance material we can tint for the hit flash, plus its base emissive
 *  so we can restore the enemy's normal look afterwards. */
interface TintTarget {
  mat: THREE.MeshStandardMaterial;
  baseEmissive: number;
  baseIntensity: number;
}

interface EnemyView {
  root: THREE.Object3D;
  mixer?: THREE.AnimationMixer;
  walk?: THREE.AnimationAction;
  deathClip?: THREE.AnimationClip;
  /** True once the fall animation has started (enemy is DEAD). */
  dying: boolean;
  /** Seconds of fall animation left before we ask the game to remove it. */
  deathRemaining: number;
  /** Per-instance materials that can be tinted red for the hit flash. */
  tints: TintTarget[];
  /** Seconds of hit-flash glow left (0 = not flashing). */
  flashRemaining: number;
  /** Health seen last frame, to detect a fresh hit (a drop in health). */
  lastHealth: number;
  /** Floating health bar shown above the enemy (SRS FR-41). */
  bar: HealthBar;
  /** World Y to place the bar at — just above this enemy's head. */
  headY: number;
}

/** Clone a mesh's material(s) so this enemy instance can be tinted without
 *  affecting others of the same type (GLB clones share materials by default). */
function cloneTintableMaterials(root: THREE.Object3D): TintTarget[] {
  const tints: TintTarget[] = [];
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const cloned = Array.isArray(o.material)
      ? o.material.map((m) => m.clone())
      : o.material.clone();
    o.material = cloned;
    const list = Array.isArray(cloned) ? cloned : [cloned];
    for (const m of list) {
      if (m instanceof THREE.MeshStandardMaterial) {
        tints.push({
          mat: m,
          baseEmissive: m.emissive.getHex(),
          baseIntensity: m.emissiveIntensity,
        });
      }
    }
  });
  return tints;
}

/** Advance and apply the hit flash for one view. Tints its materials red while
 *  the flash lasts, then restores their base emissive when it ends. */
function applyHitFlash(view: EnemyView, dt: number): void {
  if (view.flashRemaining <= 0) return; // not flashing; materials at base
  view.flashRemaining = Math.max(0, view.flashRemaining - dt);
  const t = view.flashRemaining / HIT_FLASH_TIME; // 1 → 0 over the flash
  if (view.flashRemaining > 0) {
    for (const e of view.tints) {
      e.mat.emissive.setHex(HIT_FLASH_COLOR);
      e.mat.emissiveIntensity = HIT_FLASH_MAX * t;
    }
  } else {
    for (const e of view.tints) {
      e.mat.emissive.setHex(e.baseEmissive);
      e.mat.emissiveIntensity = e.baseIntensity;
    }
  }
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
  camera: THREE.Camera,
  onExpired: (id: string) => void,
): EnemyRenderer {
  const views = new Map<string, EnemyView>();

  /** Build a health bar, add it to the scene, and return it with the world Y to
   *  hover it at. */
  function makeBar(headY: number): { bar: HealthBar; headY: number } {
    const bar = createHealthBar();
    scene.add(bar.group);
    return { bar, headY };
  }

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
        tints: cloneTintableMaterials(model), // per-instance, for the hit flash
        flashRemaining: 0,
        lastHealth: enemy.health,
        ...makeBar(BAR_HEAD_Y[enemy.type]), // fixed per-type bar height
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
    return {
      root: cube,
      dying: false,
      deathRemaining: 0,
      tints: [
        {
          mat: cube.material as THREE.MeshStandardMaterial,
          baseEmissive: (cube.material as THREE.MeshStandardMaterial).emissive.getHex(),
          baseIntensity: (cube.material as THREE.MeshStandardMaterial).emissiveIntensity,
        },
      ],
      flashRemaining: 0,
      lastHealth: enemy.health,
      ...makeBar(2.6), // fallback cube bar height
    };
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
    scene.remove(view.bar.group);
    view.bar.dispose();
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

        // Hit feedback (SRS FR-40): a drop in health since last frame means the
        // enemy just took damage — trigger the red glow. Then advance/apply it.
        if (enemy.health < view.lastHealth) view.flashRemaining = HIT_FLASH_TIME;
        view.lastHealth = enemy.health;
        applyHitFlash(view, dt);

        // Health bar (SRS FR-41): hover above the enemy, fill = HP fraction,
        // face the camera. Hidden once dead (it's at 0 and the body is falling).
        view.bar.group.visible = enemy.state !== "dead";
        if (view.bar.group.visible) {
          view.bar.group.position.set(enemy.pos.x, view.headY, enemy.pos.z);
          view.bar.setFraction(enemy.health / enemy.maxHealth);
          view.bar.faceCamera(camera);
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
/** Big Shots render red so they stand out from normal shots (SRS FR-18, QA). */
const BIG_SHOT_COLOR = 0xe22424;

export interface BulletRenderer {
  /** Reconcile cannonball meshes with the current bullets. */
  sync: (bullets: Bullet[]) => void;
  /** Remove and dispose every bullet mesh. Call on unmount. */
  dispose: () => void;
}

/** A metallic sphere — the cannonball. Big Shots are red, normal shots dark. */
function buildBulletMesh(isBigShot: boolean): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BULLET_RADIUS, 16, 16),
    new THREE.MeshStandardMaterial({
      color: isBigShot ? BIG_SHOT_COLOR : BULLET_COLOR,
      roughness: 0.35,
      metalness: 0.7,
      emissive: isBigShot ? BIG_SHOT_COLOR : 0x000000,
      emissiveIntensity: isBigShot ? 0.4 : 0,
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
          mesh = buildBulletMesh(bullet.isBigShot);
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

/* =============================================================================
 * Phase 7 — Weapon (cannon) rendering.
 *   The player owns ONE cannon at a time (SRS): the active weapon's model is
 *   shown in the gray strip, the other two stay hidden. All three GLBs are built
 *   once (so a weapon swap is instant, no pop-in) and toggled by `sync(weapon)`.
 *   Replaces the static cannon that scenery used to add, so the rendered cannon
 *   tracks weapon progression (SRS FR-25, BR-94 deviation: the player chooses).
 * ============================================================================= */

const WEAPON_MODEL_KEY: Record<WeaponLevel, ModelKey> = {
  basic: "weaponBasic",
  medium: "weaponMedium",
  advanced: "weaponAdvanced",
};

export interface WeaponRenderer {
  /** Show the active weapon's cannon; hide the others. */
  sync: (weapon: WeaponLevel) => void;
  /** Remove and dispose every cannon object. Call on unmount. */
  dispose: () => void;
}

/** Build the cannon for one weapon level (GLB from cache, or a fallback box). */
function buildCannon(level: WeaponLevel): THREE.Object3D {
  const key = WEAPON_MODEL_KEY[level];
  if (hasModel(key)) {
    const cannon = getModel(key);
    scaleToExtent(cannon, WEAPON_WIDTH, "x");
    cannon.rotation.y = WEAPONS[level].rotationY; // per-weapon: face the yard (+x)
    centerOnGround(cannon);
    cannon.position.x += WEAPON_X;
    cannon.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true;
    });
    return cannon;
  }
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.2, 2),
    new THREE.MeshStandardMaterial({ color: 0x444a52, roughness: 0.6 }),
  );
  box.position.set(WEAPON_X, 0.6, 0);
  box.castShadow = true;
  return box;
}

export function createWeaponRenderer(scene: THREE.Scene): WeaponRenderer {
  const cannons = new Map<WeaponLevel, THREE.Object3D>();
  for (const level of WEAPON_ORDER) {
    const cannon = buildCannon(level);
    cannon.visible = false; // sync() reveals the active one on the first frame
    scene.add(cannon);
    cannons.set(level, cannon);
  }

  return {
    sync(weapon) {
      for (const [level, cannon] of cannons) cannon.visible = level === weapon;
    },
    dispose() {
      for (const cannon of cannons.values()) {
        scene.remove(cannon);
        cannon.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            const mat = o.material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          }
        });
      }
      cannons.clear();
    },
  };
}
