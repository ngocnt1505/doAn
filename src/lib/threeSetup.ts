/* =============================================================================
 * src/lib/threeSetup.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   One-shot construction of the Three.js renderer, scene, and camera and
 *   the matching teardown. Returns a `ThreeContext` object that the game
 *   loop and render system consume.
 *
 * WHY IT EXISTS
 *   Three.js objects are heavy and side-effectful (they grab a WebGL
 *   context). They must be created exactly once when the canvas mounts and
 *   disposed exactly once when it unmounts. Centralising that contract
 *   here prevents leaks and double-init bugs in React's StrictMode.
 *
 * WHAT BELONGS HERE
 *   - Renderer, scene, camera wiring
 *   - Resize handling
 *   - dispose / cleanup
 *
 * WHAT DOES NOT BELONG HERE
 *   - Per-frame rendering (`src/systems/renderSystem.ts`)
 *   - Entity meshes (`src/entities/*`)
 *   - Game logic
 * ============================================================================= */

import * as THREE from "three";
import { createCamera, resizeCamera } from "./camera";
import { addDefaultLights } from "./lighting";
import { buildFenceRow } from "./scenery";
import { createHouseMesh } from "@/entities/House";
import {
  HOUSE_POSITION,
  WORLD_HALF_SIZE,
  YARD_CENTER_X,
  YARD_HALF_DEPTH,
} from "@/core/constants";

export interface ThreeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Convenience: stable parent for entity meshes so the renderer can clear
   *  them cleanly on reset. */
  entityRoot: THREE.Group;
  /** The yard plane. Exposed so mouse picking can raycast against it without
   *  having to walk the scene graph. */
  ground: THREE.Mesh;
  /** Tear everything down — called when the React component unmounts. */
  dispose: () => void;
}

/** Dispose every geometry & material under an object. Used to free the
 *  procedural placeholder once the authored model replaces it, and to clean
 *  up a model that arrives after teardown. */
function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose?.();
  });
}

export function createThreeContext(canvas: HTMLCanvasElement): ThreeContext {
  const { clientWidth, clientHeight } = canvas;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(clientWidth, clientHeight, false);
  renderer.setClearColor(0x0b0d12, 1);

  const scene = new THREE.Scene();
  const camera = createCamera(clientWidth, clientHeight);

  addDefaultLights(scene);

  // The playable yard — a rectangle wider in x (the action axis, cannon →
  // enemies) than in z. Also doubles as the raycast target for mouse aiming,
  // which is why it leaves the ThreeContext on the way out. The house and
  // fences live OUTSIDE this rectangle so it represents only "the playfield".
  const yardW = WORLD_HALF_SIZE * 2;
  const yardD = YARD_HALF_DEPTH * 2;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(yardW, yardD, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x2a3a28 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.x = YARD_CENTER_X; // yard is right-aligned in the world
  ground.name = "ground";
  scene.add(ground);

  // Subtle grid scaled to the yard so motion reads even with no entities.
  // GridHelper is always square, so we use the larger of the two dimensions
  // and let the ground plane mask off the part that hangs over.
  const grid = new THREE.GridHelper(yardW, Math.round(yardW / 2), 0x3a4150, 0x2a313e);
  grid.position.set(YARD_CENTER_X, 0.01, 0); // hair above ground to dodge z-fighting
  scene.add(grid);

  /* --- Scenery: house behind the cannon + fence at the far edge -------- */
  // The house is decorative — outside the playfield, on the cannon's left.
  // Models are already preloaded (see GameCanvas), so this clones instantly.
  const house = createHouseMesh();
  house.position.set(...HOUSE_POSITION);
  // Face the door toward +x — the direction enemies advance from (see
  // camera.ts). The model's door points +z (at the camera) by default, and a
  // +90° turn about Y maps that +z facing onto +x.
  house.rotation.y = Math.PI / 2;
  scene.add(house);

  // Fence along the far (-z) edge — the side opposite the camera. Spans the
  // full width of the yard so the playfield reads as walled-off.
  const fenceBack = buildFenceRow(yardW);
  fenceBack.position.set(YARD_CENTER_X, 0, -YARD_HALF_DEPTH);
  scene.add(fenceBack);

  // Entity meshes get parented here so they can be wiped in one detach.
  const entityRoot = new THREE.Group();
  entityRoot.name = "entityRoot";
  scene.add(entityRoot);

  /* --- Resize handling -------------------------------------------------- */
  const handleResize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    resizeCamera(camera, w, h);
  };
  window.addEventListener("resize", handleResize);

  /* --- Dispose ---------------------------------------------------------- */
  const dispose = () => {
    window.removeEventListener("resize", handleResize);

    // Walk every disposable child of the scene.
    disposeObject(scene);

    renderer.dispose();
  };

  return { renderer, scene, camera, entityRoot, ground, dispose };
}
