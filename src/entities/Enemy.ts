/* =============================================================================
 * src/entities/Enemy.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Factory for enemy entities and their meshes. Each enemy comes in one of
 *   three flavors — grunt / brute / stalker — built entirely from low-poly
 *   BoxGeometry to match the cannon's blocky, hand-tooled look.
 *
 *   The pivot child group named ENEMY_BODY_NAME lets the render system tilt
 *   the whole body for the death animation without touching parent transform.
 *
 * WHAT BELONGS HERE / NOT — see the comment block in Player.ts.
 * ============================================================================= */

import * as THREE from "three";
import type { EnemyEntity, EnemyVariant, Vec3 } from "@/types/entity";
import { ENEMY_STATS } from "@/core/constants";
import { uid } from "@/lib/helpers";
import { cloneModel, normalizeModel } from "@/lib/modelCache";

/** Render system rotates this child group for facing + death-topple. */
export const ENEMY_BODY_NAME = "enemy-body";

/** Base height (m) every monster model is scaled to before the per-variant
 *  ENEMY_STATS.scale is applied — so a skeleton and a brute share a baseline
 *  and the stat scale alone decides their relative size. */
const ENEMY_MODEL_HEIGHT = 1.8;

/** Extra yaw (radians) applied to the imported model so its FRONT lines up
 *  with the body's forward (-Z, the side the render system turns toward the
 *  cannon). Bump by ±Math.PI / 2 if a monster walks sideways/backwards. */
const ENEMY_MODEL_YAW_OFFSET = 0;

export function createEnemyEntity(
  position: Vec3,
  variant: EnemyVariant,
): EnemyEntity {
  const stats = ENEMY_STATS[variant];
  return {
    id: uid("enemy"),
    kind: "enemy",
    variant,
    position,
    velocity: [0, 0, 0],
    dead: false,
    health: stats.health,
    speed: stats.speed,
    wanderPhase: Math.random() * Math.PI * 2,
  };
}

export function createEnemyMesh(
  entityId: string,
  variant: EnemyVariant,
): THREE.Object3D {
  const root = new THREE.Group();
  root.name = "enemy";
  root.userData.entityId = entityId;
  root.userData.variant = variant;

  // The body group is what gets rotated to face the cannon and toppled on
  // death. YXZ order so yaw is applied BEFORE the death-topple pitch — that
  // keeps "topple forward" consistent regardless of which way the body faces.
  const body = new THREE.Group();
  body.name = ENEMY_BODY_NAME;
  body.rotation.order = "YXZ";
  body.scale.setScalar(ENEMY_STATS[variant].scale);
  root.add(body);

  // Prefer the authored .glb for this variant; fall back to the procedural
  // box-monster if it didn't load. Either way it lives inside `body`, so the
  // render system's facing + death-topple keep working unchanged.
  const model = cloneModel(`enemy:${variant}`);
  console.log(`[enemy mesh] variant=${variant} model=${!!model}`);
  if (model) {
    normalizeModel(model, { height: ENEMY_MODEL_HEIGHT });
    model.rotation.y = ENEMY_MODEL_YAW_OFFSET;
    body.add(model);
  } else {
    switch (variant) {
      case "grunt":   buildGrunt(body); break;
      case "brute":   buildBrute(body); break;
      case "stalker": buildStalker(body); break;
    }
  }

  return root;
}

/* ---------- Shared materials --------------------------------------------- *
 * Same palette + finish as the cannon (Player.ts) so the bestiary reads as
 * one art set. Re-using material instances is cheaper than per-mesh ones.   */

const woodMat = new THREE.MeshStandardMaterial({
  color: 0x6b3e1f, metalness: 0.0, roughness: 0.85,
});
const darkWoodMat = new THREE.MeshStandardMaterial({
  color: 0x3d2412, metalness: 0.0, roughness: 0.9,
});
const metalMat = new THREE.MeshStandardMaterial({
  color: 0x6b7280, metalness: 0.5, roughness: 0.5,
});
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4a52, metalness: 0.15, roughness: 0.95,
});
const eyeMat = new THREE.MeshStandardMaterial({
  color: 0xffb347, metalness: 0.0, roughness: 0.3,
  emissive: 0xff7a00, emissiveIntensity: 0.6,
});

/* ---------- Variant builders --------------------------------------------- */

/** Grunt: a single chunky wooden box with glowing eyes. Light, quick, frail. */
function buildGrunt(body: THREE.Group): void {
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), woodMat);
  torso.position.y = 0.45;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), darkWoodMat);
  head.position.y = 1.15;
  body.add(head);

  // Two eye cubes on the FRONT face (-Z, since the body will be rotated so
  // -Z points toward the cannon). Small enough to read as eyes, not pixels.
  const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.06);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.13, 1.18, -0.31);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set( 0.13, 1.18, -0.31);
  body.add(eyeL, eyeR);

  // Two tiny stub feet — purely decorative, no animation.
  const footGeo = new THREE.BoxGeometry(0.25, 0.2, 0.3);
  const footL = new THREE.Mesh(footGeo, darkWoodMat);
  footL.position.set(-0.25, 0.1, 0.05);
  const footR = new THREE.Mesh(footGeo, darkWoodMat);
  footR.position.set( 0.25, 0.1, 0.05);
  body.add(footL, footR);
}

/** Brute: stacked stone boxes with iron arms. Slow tank, big silhouette. */
function buildBrute(body: THREE.Group): void {
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.2), stoneMat);
  torso.position.y = 0.95;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), stoneMat);
  head.position.y = 2.0;
  body.add(head);

  // Iron pauldrons on top of the shoulders — readable "armoured" silhouette.
  const pauldronGeo = new THREE.BoxGeometry(0.5, 0.35, 1.3);
  const pauldL = new THREE.Mesh(pauldronGeo, metalMat);
  pauldL.position.set(-0.95, 1.55, 0);
  const pauldR = new THREE.Mesh(pauldronGeo, metalMat);
  pauldR.position.set( 0.95, 1.55, 0);
  body.add(pauldL, pauldR);

  // Hanging block-arms.
  const armGeo = new THREE.BoxGeometry(0.45, 1.1, 0.45);
  const armL = new THREE.Mesh(armGeo, metalMat);
  armL.position.set(-1.0, 0.85, 0);
  const armR = new THREE.Mesh(armGeo, metalMat);
  armR.position.set( 1.0, 0.85, 0);
  body.add(armL, armR);

  // Stumpy stone legs.
  const legGeo = new THREE.BoxGeometry(0.55, 0.5, 0.55);
  const legL = new THREE.Mesh(legGeo, stoneMat);
  legL.position.set(-0.4, 0.25, 0);
  const legR = new THREE.Mesh(legGeo, stoneMat);
  legR.position.set( 0.4, 0.25, 0);
  body.add(legL, legR);

  // Single big red eye on the head — easy way to make the brute feel angry.
  const eye = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.12, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0xff3030, emissive: 0xff0000, emissiveIntensity: 0.8,
      roughness: 0.4,
    }),
  );
  eye.position.set(0, 2.05, -0.41);
  body.add(eye);
}

/** Stalker: tall thin marauder on stilt legs. Medium everything. */
function buildStalker(body: THREE.Group): void {
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.5), darkWoodMat);
  torso.position.y = 1.4;
  body.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), woodMat);
  head.position.y = 2.25;
  body.add(head);

  // Long stilt legs make it read as creeping/striding even when static.
  const legGeo = new THREE.BoxGeometry(0.18, 0.85, 0.18);
  const legL = new THREE.Mesh(legGeo, darkWoodMat);
  legL.position.set(-0.18, 0.42, 0);
  const legR = new THREE.Mesh(legGeo, darkWoodMat);
  legR.position.set( 0.18, 0.42, 0);
  body.add(legL, legR);

  // Outstretched arms — thin metal blades for the reach.
  const armGeo = new THREE.BoxGeometry(0.12, 0.12, 0.9);
  const armL = new THREE.Mesh(armGeo, metalMat);
  armL.position.set(-0.4, 1.7, -0.3);
  const armR = new THREE.Mesh(armGeo, metalMat);
  armR.position.set( 0.4, 1.7, -0.3);
  body.add(armL, armR);

  // Three small eyes in a vertical strip — distinct silhouette read.
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  for (let i = 0; i < 3; i++) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 2.35 - i * 0.12, -0.26);
    body.add(eye);
  }
}
