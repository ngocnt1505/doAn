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

export interface ThreeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Convenience: stable parent for entity meshes so the renderer can clear
   *  them cleanly on reset. */
  entityRoot: THREE.Group;
  /** Tear everything down — called when the React component unmounts. */
  dispose: () => void;
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

  // A simple ground plane so the scene isn't an empty void on first load.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x202733 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // A subtle grid so motion is visible even with no entities.
  const grid = new THREE.GridHelper(60, 30, 0x3a4150, 0x2a313e);
  // Lift a hair above the ground to avoid z-fighting.
  grid.position.y = 0.01;
  scene.add(grid);

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
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry?.dispose?.();
      }
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose?.();
    });

    renderer.dispose();
  };

  return { renderer, scene, camera, entityRoot, dispose };
}
