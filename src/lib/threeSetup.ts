/* =============================================================================
 * src/lib/threeSetup.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Builds the Three.js "context": renderer, scene, and camera, then assembles
 *   the static world via the lighting and scenery helpers. Returns a small
 *   handle (resize / render / dispose) so the React bridge can drive the frame
 *   loop and tear everything down on unmount.
 *
 *   This file owns ONLY the rendering layer (SRS Rendering Layer). Game state,
 *   entities and systems are layered on top.
 *
 * WHAT BELONGS HERE
 *   - Renderer creation + global render flags (shadows, pixel ratio)
 *   - Wiring camera + lighting + scenery into one scene
 *   - resize / render / dispose plumbing
 *
 * WHAT DOES NOT BELONG HERE
 *   - Camera framing details (→ `camera.ts`)
 *   - Light/scenery construction (→ `lighting.ts`, `scenery.ts`)
 *   - React (→ `src/components/GameCanvas.tsx`)
 * ============================================================================= */

import * as THREE from "three";
import { createCamera } from "@/lib/camera";
import { addLighting } from "@/lib/lighting";
import { addScenery } from "@/lib/scenery";

export interface ThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Resize the renderer + camera to a new pixel size. */
  resize: (width: number, height: number) => void;
  /** Render a single frame. */
  render: () => void;
  /** Release all GPU resources. Call once on unmount. */
  dispose: () => void;
}

export function createThreeContext(canvas: HTMLCanvasElement): ThreeContext {
  // --- Renderer -------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // --- Scene ----------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);
  scene.fog = new THREE.Fog(0x0b1020, 45, 90);

  // --- Camera + world -------------------------------------------------------
  const camera = createCamera();
  addLighting(scene);
  addScenery(scene);

  // --- Handle ---------------------------------------------------------------
  function resize(width: number, height: number) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const material = obj.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material.dispose();
      }
    });
    renderer.dispose();
  }

  return { scene, camera, renderer, resize, render, dispose };
}
