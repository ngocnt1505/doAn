/* =============================================================================
 * src/systems/spawnSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Enemy spawn scheduling (SRS FR-21 / FR-22). A small stateful scheduler that,
 *   while the game is Playing, creates the current wave's roster over time:
 *     - first enemy ~3s after "Ready"            (BR-23 / TR-4)
 *     - then one at a time, sequentially         (BR-82)
 *     - gap before each = its type's interval    (BR-79 easy 3s / BR-80 medium
 *       4s / BR-81 hard 5s)
 *     - stop once the whole roster is created     (BR-84)
 *   Spawning freezes when the game isn't Playing (paused/countdown), and re-arms
 *   for a fresh game.
 *
 * WHAT IT DOES NOT DO (separate FRs, not built yet)
 *   - Wave completion detection (FR-23) / wave transitions (FR-24): the wave
 *     number never advances here, so only the current wave's roster spawns.
 * ============================================================================= */

import type { EnemyManager } from "@/systems/enemyManager";
import type { EnemyType } from "@/types/entity";
import type { GameStatus } from "@/types/game";
import { SPAWN_X, YARD_HALF_DEPTH } from "@/core/constants";

/** Per-wave enemy roster (SRS BR-75/76/77). Ordered easy → medium → hard. */
const WAVE_COMPOSITION: Record<number, EnemyType[]> = {
  1: ["easy", "easy", "medium"],
  2: ["easy", "easy", "medium", "medium", "hard"],
  3: ["easy", "easy", "medium", "medium", "hard", "hard", "hard"],
};

/** Spawn interval per type, seconds (SRS BR-79/80/81). */
const SPAWN_INTERVAL: Record<EnemyType, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

/** Delay before the FIRST enemy of a wave, seconds (SRS BR-23 / TR-4). */
const FIRST_SPAWN_DELAY = 3;

/** Keep spawned enemies clear of the yard's depth edges. */
const SPAWN_DEPTH_MARGIN = 4;

export interface SpawnScheduler {
  /** Call every frame. Spawns the current wave's enemies on schedule while the
   *  game is Playing; freezes otherwise. */
  update: (dt: number, wave: number, status: GameStatus) => void;
}

export function createSpawnScheduler(manager: EnemyManager): SpawnScheduler {
  let roster: EnemyType[] = [];
  let cursor = 0; // how many of the current wave's enemies have spawned
  let timer = 0; // seconds until the next spawn
  let loadedWave = 0; // 0 = no wave loaded (re-arm sentinel)

  function loadWave(wave: number): void {
    roster = WAVE_COMPOSITION[wave] ?? [];
    cursor = 0;
    timer = FIRST_SPAWN_DELAY; // BR-23: gap before the first enemy
    loadedWave = wave;
  }

  /** A spread-out spawn lane on the spawn line (BR-29 distributed). */
  function spawnLaneZ(): number {
    const half = YARD_HALF_DEPTH - SPAWN_DEPTH_MARGIN;
    return (Math.random() * 2 - 1) * half;
  }

  return {
    update(dt, wave, status) {
      // No spawning during the welcome screen / countdown (BR-2, TR-2/TR-3);
      // reset so the next play re-arms the wave from the start.
      if (status === "idle" || status === "countdown") {
        loadedWave = 0;
        return;
      }
      // Freeze while paused / won / lost (only Playing spawns).
      if (status !== "playing") return;

      if (wave !== loadedWave) loadWave(wave);
      if (cursor >= roster.length) return; // BR-84: roster fully created

      timer -= dt;
      while (timer <= 0 && cursor < roster.length) {
        const type = roster[cursor];
        manager.spawn(type, { x: SPAWN_X, z: spawnLaneZ() }); // BR-83: moves at once
        cursor += 1;
        // Gap before the NEXT enemy = that enemy's own interval (BR-79/80/81).
        if (cursor < roster.length) timer += SPAWN_INTERVAL[roster[cursor]];
      }
    },
  };
}
