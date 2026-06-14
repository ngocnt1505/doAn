/* =============================================================================
 * src/entities/Player.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for the player. Produces:
 *     - The player STATE (a `PlayerEntity` — plain data)
 *     - The player MESH (a `THREE.Object3D` for the renderer)
 *
 *   In this build the player is a stationary CANNON: a wheeled base plus a
 *   barrel that pivots to aim at the click point. The barrel sits inside a
 *   named child group ("pivot") so the render system can orient it without
 *   touching the base.
 *
 * WHAT BELONGS HERE
 *   - Default values + mesh geometry/material for this kind
 *
 * WHAT DOES NOT BELONG HERE
 *   - Aim math — renderSystem reads `aimTarget` and orients the pivot
 *   - Shooting logic — shootingSystem
 * ============================================================================= */

import * as THREE from "three";
import type { PlayerEntity } from "@/types/entity";
import {
  CANNON_POSITION,
  PLAYER_ID,
  PLAYER_MAX_HEALTH,
} from "@/core/constants";
import { cloneModel, normalizeModel } from "@/lib/modelCache";

/** Name used by renderSystem to find the pivot child and aim the barrel. */
export const CANNON_PIVOT_NAME = "cannon-pivot";

/** Footprint (m) the cannon model is scaled to. */
const CANNON_TARGET_WIDTH = 2.5;

/** Extra yaw (radians) so the model's barrel lines up with the aim direction.
 *  renderSystem rotates the pivot so its local +Z faces the target, then adds
 *  this. If the cannon ends up aiming 90°/180° off, nudge this by ±Math.PI/2. */
export const CANNON_AIM_YAW_OFFSET = 0;

/** Build a fresh player state object — a cannon parked on the south edge. */
export function createPlayerEntity(): PlayerEntity {
  return {
    id: PLAYER_ID,
    kind: "player",
    position: [CANNON_POSITION[0], CANNON_POSITION[1], CANNON_POSITION[2]],
    velocity: [0, 0, 0],
    dead: false,
    health: PLAYER_MAX_HEALTH,
    lastShotAt: 0,
    // Default aim: down the +x axis, at muzzle height. The render system uses
    // this each frame to orient the barrel, so a non-null default means the
    // cannon points toward the incoming enemies before the first click.
    aimTarget: [CANNON_POSITION[0] + 10, CANNON_POSITION[1] + 1, CANNON_POSITION[2]],
  };
}

/** Build the Three.js mesh that represents the cannon. */
export function createPlayerMesh(): THREE.Object3D {
  const root = new THREE.Group();
  root.name = "cannon";
  root.userData.entityId = PLAYER_ID;

  // The pivot is what renderSystem yaws to aim. For the authored model the
  // whole cannon swivels as one piece around its base (a turret), so the
  // grounded model goes straight inside the pivot at y=0.
  const aimPivot = new THREE.Group();
  aimPivot.name = CANNON_PIVOT_NAME;
  root.add(aimPivot);

  const model = cloneModel("cannon");
  if (model) {
    normalizeModel(model, { width: CANNON_TARGET_WIDTH });
    aimPivot.add(model);
    return root;
  }

  // ---- Procedural fallback (model failed to load) -----------------------
  const metal = new THREE.MeshStandardMaterial({
    color: 0x6b7280,
    metalness: 0.5,
    roughness: 0.5,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: 0x6b3e1f,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Wheeled wooden base — two thin discs joined by a low box.
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.18, 16);
  const wheelL = new THREE.Mesh(wheelGeo, wood);
  wheelL.rotation.z = Math.PI / 2;
  wheelL.position.set(-0.6, 0.5, 0);
  const wheelR = new THREE.Mesh(wheelGeo, wood);
  wheelR.rotation.z = Math.PI / 2;
  wheelR.position.set(0.6, 0.5, 0);

  const carriage = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.4, 1.2),
    wood,
  );
  carriage.position.set(0, 0.7, 0);

  root.add(wheelL, wheelR, carriage);

  // Reuse the aim pivot built above; raise it to muzzle height. renderSystem
  // yaws it so its local +Z faces the aim point, so the barrel runs along +Z.
  const pivot = aimPivot;
  pivot.position.set(0, 1.0, 0);

  // Barrel — a tapered cylinder aligned along +Z (the aim axis). Three.js
  // cylinders are built along +Y, so we rotate +90° about X to send +Y → +Z,
  // then push the geometry forward so the muzzle sits at +length on Z.
  const barrelLength = 1.4;
  const barrelGeo = new THREE.CylinderGeometry(
    0.16, 0.22, barrelLength, 20,
  );
  const barrel = new THREE.Mesh(barrelGeo, metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = barrelLength / 2;
  pivot.add(barrel);

  // Reinforcement ring near the breech.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.05, 8, 20),
    metal,
  );
  ring.position.z = 0.15;
  pivot.add(ring);

  return root;
}
