/* =============================================================================
 * src/systems/waveSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Drives wave-based difficulty: starts a new wave on a fixed interval,
 *   decides how many enemies to spawn, and asks the spawn system to do so.
 *
 * WHY IT EXISTS
 *   Wave logic is a classic "designer-tunable" feature. Keeping it in its
 *   own system means a thesis reader can find it instantly, and the math
 *   (count, cadence, scaling) is in one place.
 *
 * WHAT BELONGS HERE
 *   - Wave timer / counter
 *   - Difficulty curve
 *   - Calls into `requestEnemySpawn()`
 *
 * WHAT DOES NOT BELONG HERE
 *   - Building the actual enemy entity (`src/entities/Enemy.ts`)
 *   - Spawning logic / queue draining (`spawnSystem.ts`)
 * ============================================================================= */

import { dispatch, getState } from "@/core/gameStore";
import {
  WAVE_BASE_COUNT,
  WAVE_INTERVAL_MS,
  WORLD_HALF_SIZE,
} from "@/core/constants";
import { randRange } from "@/lib/helpers";
import { requestEnemySpawn } from "./spawnSystem";
import type { Vec3 } from "@/types/entity";

let nextWaveAt = WAVE_INTERVAL_MS; // ms (relative to GameState.elapsedMs)

export function waveSystem(_dt: number): void {
  const state = getState();
  if (state.elapsedMs < nextWaveAt) return;

  const wave = state.wave + 1;
  const count = WAVE_BASE_COUNT + (wave - 1) * 2; // grows linearly per wave

  for (let i = 0; i < count; i++) {
    // Spawn around the edges of the world, on the ground plane (y = 0.5).
    const angle = Math.random() * Math.PI * 2;
    const radius = WORLD_HALF_SIZE * randRange(0.7, 0.95);
    const position: Vec3 = [
      Math.cos(angle) * radius,
      0.5,
      Math.sin(angle) * radius,
    ];
    requestEnemySpawn(position);
  }

  dispatch({ type: "SET_WAVE", wave });
  nextWaveAt = state.elapsedMs + WAVE_INTERVAL_MS;
}

/** Reset wave scheduling. Call when the player presses START / RESET. */
export function resetWaveSchedule(): void {
  nextWaveAt = WAVE_INTERVAL_MS;
}
