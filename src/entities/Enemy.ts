// Factory for enemy entities (plain data, no Three.js). id + type + lifecycle
// state + health + ground position, plus a random weave phase/amplitude.

import type { Enemy, EnemyType, GroundPos } from "@/types/entity";

// Maximum (and starting) health per type.
const ENEMY_HP: Record<EnemyType, number> = {
  easy: 100,
  medium: 200,
  hard: 400,
};

// Amplitude range (world units) of the lateral sine weave.
const WANDER_AMP_MIN = 2.5;
const WANDER_AMP_MAX = 6;

let nextId = 0;

// Create one enemy of `type` at a ground position. Starts SPAWNING with full
// health and a random weave phase + amplitude.
export function createEnemy(type: EnemyType, pos: GroundPos): Enemy {
  const maxHealth = ENEMY_HP[type];
  return {
    id: `enemy-${nextId++}`,
    type,
    state: "spawning",
    health: maxHealth,
    maxHealth,
    pos,
    baseZ: pos.z,
    wanderPhase: Math.random() * Math.PI * 2,
    wanderAmp: WANDER_AMP_MIN + Math.random() * (WANDER_AMP_MAX - WANDER_AMP_MIN),
  };
}
