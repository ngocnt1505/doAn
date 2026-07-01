// Mirrors game DATA onto Three.js OBJECTS (enemies, marker, bullets, weapon).
// Stateful renderers: each owns an id→view map and reconciles it per frame.

import * as THREE from "three";
import type { Bullet, Enemy, EnemyType, TargetMarker, WeaponLevel } from "@/types/entity";
import type { ModelKey } from "@/lib/models";
import { getAnimations, getModel, hasModel } from "@/lib/modelCache";
import { centerOnGround, scaleToExtent } from "@/lib/helpers";
import { WEAPON_WIDTH, WEAPON_X } from "@/core/constants";
import { WEAPONS, WEAPON_ORDER } from "@/core/weapons";
import { createHealthBar, type HealthBar } from "@/entities/HealthBar";

// Each enemy type renders with its own GLB; clips are selected by name.
const MODEL_BY_TYPE: Record<EnemyType, ModelKey> = {
  easy: "enemyEasy",
  medium: "enemyMedium",
  hard: "enemyHard",
};
const WALK_CLIP = /walk/i;
const DEATH_CLIP = /death|die|fall/i;

// Yaw so a model faces the house it walks toward (-x).
const ENEMY_FACING_Y = -Math.PI / 2;

// Uniform scale per type (the three rigs have different native sizes).
const ENEMY_SCALE: Record<EnemyType, number> = {
  easy: 2,
  medium: 2,
  hard: 3,
};

// World Y to float each type's health bar at (just above the visible head).
const BAR_HEAD_Y: Record<EnemyType, number> = {
  easy: 4,
  medium: 4,
  hard: 5,
};

// Hit feedback: an enemy that loses health briefly glows red, then fades back.
const HIT_FLASH_TIME = 0.22;
const HIT_FLASH_COLOR = 0xff2a2a;
const HIT_FLASH_MAX = 0.95;

// A per-instance material we can tint for the hit flash, plus its base emissive.
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
  dying: boolean;
  deathRemaining: number;
  tints: TintTarget[];
  flashRemaining: number;
  lastHealth: number;
  bar: HealthBar;
  headY: number;
}

// Clone a mesh's material(s) so this instance can be tinted independently.
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

// Advance and apply the hit flash for one view.
function applyHitFlash(view: EnemyView, dt: number): void {
  if (view.flashRemaining <= 0) return;
  view.flashRemaining = Math.max(0, view.flashRemaining - dt);
  const t = view.flashRemaining / HIT_FLASH_TIME;
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
  sync: (enemies: Enemy[], dt: number) => void;
  dispose: () => void;
}

// `onExpired(id)` fires once a dead enemy's fall animation has finished.
export function createEnemyRenderer(
  scene: THREE.Scene,
  camera: THREE.Camera,
  onExpired: (id: string) => void,
): EnemyRenderer {
  const views = new Map<string, EnemyView>();

  // Build a health bar, add it to the scene, and return it with its hover height.
  function makeBar(headY: number): { bar: HealthBar; headY: number } {
    const bar = createHealthBar();
    scene.add(bar.group);
    return { bar, headY };
  }

  // Build the view for one enemy (GLB model + animation, or a fallback cube).
  function createView(enemy: Enemy): EnemyView {
    const key = MODEL_BY_TYPE[enemy.type];
    if (hasModel(key)) {
      const model = getModel(key);
      model.rotation.y = ENEMY_FACING_Y;
      model.scale.setScalar(ENEMY_SCALE[enemy.type]);
      model.traverse((o) => {
        o.frustumCulled = false;
      });
      scene.add(model);

      const clips = getAnimations(key);
      const view: EnemyView = {
        root: model,
        deathClip: clips.find((c) => DEATH_CLIP.test(c.name)),
        dying: false,
        deathRemaining: 0,
        tints: cloneTintableMaterials(model),
        flashRemaining: 0,
        lastHealth: enemy.health,
        ...makeBar(BAR_HEAD_Y[enemy.type]),
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

    // Fallback cube if the GLB failed to load.
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
      ...makeBar(2.6),
    };
  }

  // Switch a view to its death animation (or mark it for instant removal).
  function startDeath(view: EnemyView): void {
    view.dying = true;
    if (view.mixer && view.deathClip) {
      view.walk?.fadeOut(0.15);
      const action = view.mixer.clipAction(view.deathClip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(0.15).play();
      view.deathRemaining = view.deathClip.duration;
    } else {
      view.deathRemaining = 0;
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
    // Reconcile meshes with state, drive hit flash / health bar / animation.
    sync(enemies, dt) {
      const live = new Set<string>();

      for (const enemy of enemies) {
        live.add(enemy.id);
        let view = views.get(enemy.id);
        if (!view) {
          view = createView(enemy);
          views.set(enemy.id, view);
        }

        // A drop in health since last frame triggers the red hit flash.
        if (enemy.health < view.lastHealth) view.flashRemaining = HIT_FLASH_TIME;
        view.lastHealth = enemy.health;
        applyHitFlash(view, dt);

        // Health bar: hover above the enemy, fill = HP fraction, face the camera.
        view.bar.group.visible = enemy.state !== "dead";
        if (view.bar.group.visible) {
          view.bar.group.position.set(enemy.pos.x, view.headY, enemy.pos.z);
          view.bar.setFraction(enemy.health / enemy.maxHealth);
          view.bar.faceCamera(camera);
        }

        if (enemy.state === "dead") {
          if (!view.dying) startDeath(view);
          view.mixer?.update(dt);
          view.deathRemaining -= dt;
          if (view.deathRemaining <= 0) onExpired(enemy.id);
        } else {
          view.root.position.set(enemy.pos.x, 0, enemy.pos.z);
          view.mixer?.update(dt);
        }
      }

      // Reap views whose enemy left state.
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

// Target Marker renderer — mirrors state.marker onto a single on-ground "X".

const MARKER_Y = 0.06;
const MARKER_ARM = 1.4;
const MARKER_BAR = 0.28;
const MARKER_COLOR = 0xff3b3b;

export interface TargetMarkerRenderer {
  sync: (marker: TargetMarker | null) => void;
  dispose: () => void;
}

// Build a flat red "X" (two crossed bars lying on the XZ plane).
function buildMarkerMesh(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
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
  marker.visible = false;
  scene.add(marker);

  return {
    // Show/move the X to `target`, or hide it when null.
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

// Bullet renderer — mirrors state.bullets onto cannonball meshes (one per id).

const BULLET_RADIUS = 0.4;
const BULLET_COLOR = 0x222428;
const BIG_SHOT_COLOR = 0xe22424;

export interface BulletRenderer {
  sync: (bullets: Bullet[]) => void;
  dispose: () => void;
}

// A metallic sphere — the cannonball. Big Shots are red, normal shots dark.
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
    // Add a sphere for new bullets, move existing ones, reap the rest.
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

// Weapon (cannon) renderer — one cannon visible at a time; all three built once.

const WEAPON_MODEL_KEY: Record<WeaponLevel, ModelKey> = {
  basic: "weaponBasic",
  medium: "weaponMedium",
  advanced: "weaponAdvanced",
};

export interface WeaponRenderer {
  sync: (weapon: WeaponLevel) => void;
  dispose: () => void;
}

// Build the cannon for one weapon level (GLB from cache, or a fallback box).
function buildCannon(level: WeaponLevel): THREE.Object3D {
  const key = WEAPON_MODEL_KEY[level];
  if (hasModel(key)) {
    const cannon = getModel(key);
    scaleToExtent(cannon, WEAPON_WIDTH, "x");
    cannon.rotation.y = WEAPONS[level].rotationY;
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
    cannon.visible = false;
    scene.add(cannon);
    cannons.set(level, cannon);
  }

  return {
    // Show the active weapon's cannon; hide the others.
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
