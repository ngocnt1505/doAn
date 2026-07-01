// Builds the Three.js "context": renderer, scene, and camera, then assembles the
// static world via the lighting and scenery helpers. Returns a small handle
// (resize / render / dispose) for the React bridge.

import * as THREE from "three";
import { createCamera } from "@/lib/camera";
import { addLighting } from "@/lib/lighting";
import { addScenery } from "@/lib/scenery";

export interface ThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createThreeContext(canvas: HTMLCanvasElement): ThreeContext {
  // Renderer: antialiased, capped pixel ratio, soft shadow maps.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Scene: plain background, no fog, so the yard stays evenly lit.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x223049);

  // Camera + static world.
  const camera = createCamera();
  addLighting(scene);
  addScenery(scene);

  function resize(width: number, height: number) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render() {
    renderer.render(scene, camera);
  }

  // Release all GPU resources on unmount.
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
