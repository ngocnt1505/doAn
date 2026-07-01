// Transient projectile-impact visual effect. When a bullet lands, this spawns a
// short ground burst (expanding shockwave ring + central flash) that fades out.
// Big Shots burst bigger and red. Pure rendering helper (Three.js only).

import * as THREE from "three";
import type { GroundPos } from "@/types/entity";

// Just above the ground planes so the burst never z-fights the floor.
const EFFECT_Y = 0.08;
// Seconds an impact effect lasts before it's removed.
const LIFETIME = 0.45;
// Final shockwave radius (world units) for a normal / big shot.
const NORMAL_RADIUS = 3.2;
const BIG_RADIUS = 5;

const NORMAL_COLOR = 0xffb24d;
const BIG_COLOR = 0xff3b2e;

interface ActiveEffect {
  ring: THREE.Mesh;
  flash: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  flashMat: THREE.MeshBasicMaterial;
  age: number;
  maxRadius: number;
}

export interface ImpactRenderer {
  spawn: (pos: GroundPos, big: boolean) => void;
  update: (dt: number) => void;
  dispose: () => void;
}

export function createImpactEffects(scene: THREE.Scene): ImpactRenderer {
  // Shared unit geometries, scaled up per impact.
  const ringGeo = new THREE.RingGeometry(0.7, 1, 32);
  const discGeo = new THREE.CircleGeometry(1, 24);
  const effects: ActiveEffect[] = [];

  // Build a flat ground-lying mesh with its own material (so opacity can animate).
  function makeFlat(geo: THREE.BufferGeometry, color: number): {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
  } {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 5;
    return { mesh, mat };
  }

  function disposeEffect(e: ActiveEffect): void {
    scene.remove(e.ring, e.flash);
    e.ringMat.dispose();
    e.flashMat.dispose();
  }

  return {
    // Start an impact burst at a ground position.
    spawn(pos, big) {
      const color = big ? BIG_COLOR : NORMAL_COLOR;
      const { mesh: ring, mat: ringMat } = makeFlat(ringGeo, color);
      const { mesh: flash, mat: flashMat } = makeFlat(discGeo, color);
      for (const m of [ring, flash]) m.position.set(pos.x, EFFECT_Y, pos.z);
      scene.add(ring, flash);
      effects.push({
        ring,
        flash,
        ringMat,
        flashMat,
        age: 0,
        maxRadius: big ? BIG_RADIUS : NORMAL_RADIUS,
      });
    },

    // Advance all active effects by `dt`; dispose any that have finished.
    update(dt) {
      for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.age += dt;
        const t = e.age / LIFETIME;
        if (t >= 1) {
          disposeEffect(e);
          effects.splice(i, 1);
          continue;
        }
        // Shockwave: ease out to full radius while fading.
        const ringScale = 0.3 + e.maxRadius * (1 - (1 - t) * (1 - t));
        e.ring.scale.set(ringScale, ringScale, 1);
        e.ringMat.opacity = 1 - t;
        // Flash: a brief bright disc that shrinks and fades fast.
        const flashScale = e.maxRadius * 0.5 * (1 - t);
        e.flash.scale.set(flashScale, flashScale, 1);
        e.flashMat.opacity = Math.max(0, 1 - t * 2.5);
      }
    },

    dispose() {
      for (const e of effects) disposeEffect(e);
      effects.length = 0;
      ringGeo.dispose();
      discGeo.dispose();
    },
  };
}
