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
  YARD_CENTER_X,
  YARD_HALF_DEPTH,
} from "@/core/constants";
import { randRange } from "@/lib/helpers";
import { requestEnemySpawn } from "./spawnSystem";
import type { EnemyVariant, Vec3 } from "@/types/entity";

/** Weighted variant pick — grunts are common, brutes rare. Tweak freely. */
function pickVariant(): EnemyVariant {
  const r = Math.random();
  if (r < 0.6) return "grunt";   // 60% grunts — fodder
  if (r < 0.9) return "stalker"; // 30% stalkers
  return "brute";                // 10% brutes — the threat
}

let nextWaveAt = WAVE_INTERVAL_MS; // ms (relative to GameState.elapsedMs)

export function waveSystem(_dt: number): void {
  const state = getState();
  if (state.elapsedMs < nextWaveAt) return;

  const wave = state.wave + 1;
  const count = WAVE_BASE_COUNT + (wave - 1) * 2; // grows linearly per wave

  for (let i = 0; i < count; i++) {
    // Enemies enter only from the RIGHT edge of the yard (+x), with a small
    // spread in z so they don't stack on one line. The cannon is on the left
    // (-x) — they walk straight across the yard toward it.
    const x = YARD_CENTER_X + WORLD_HALF_SIZE * randRange(0.85, 0.98);
    const z = randRange(-YARD_HALF_DEPTH * 0.7, YARD_HALF_DEPTH * 0.7);
    const position: Vec3 = [x, 0.5, z];
    requestEnemySpawn(position, pickVariant());
  }

  dispatch({ type: "SET_WAVE", wave });
  nextWaveAt = state.elapsedMs + WAVE_INTERVAL_MS;
}

/** Reset wave scheduling. Call when the player presses START / RESET. */
export function resetWaveSchedule(): void {
  nextWaveAt = WAVE_INTERVAL_MS;
}
