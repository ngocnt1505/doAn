// Enemy spawn scheduling. While the game is playing, releases the current wave's
// roster over time: the first enemy ~3s after "Ready", then one at a time with a
// gap equal to each type's interval, stopping once the roster is created.

import type { EnemyManager } from "@/systems/enemyManager";
import type { EnemyType } from "@/types/entity";
import type { GameStatus } from "@/types/game";
import { SPAWN_X, YARD_HALF_DEPTH } from "@/core/constants";
import { WAVE_COMPOSITION } from "@/core/waves";

// Spawn interval per type, seconds.
const SPAWN_INTERVAL: Record<EnemyType, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
};

// Delay before the first enemy of a wave, seconds.
const FIRST_SPAWN_DELAY = 3;

// Keep spawned enemies clear of the yard's depth edges.
const SPAWN_DEPTH_MARGIN = 4;

export interface SpawnScheduler {
  // Call every frame; spawns the wave's enemies on schedule while playing.
  update: (dt: number, wave: number, status: GameStatus) => void;
  // True once every enemy of `wave` has been created.
  isRosterComplete: (wave: number) => boolean;
}

export function createSpawnScheduler(manager: EnemyManager): SpawnScheduler {
  let roster: EnemyType[] = [];
  let cursor = 0;
  let timer = 0;
  let loadedWave = 0;

  // Load a wave's roster and arm the first-spawn delay.
  function loadWave(wave: number): void {
    roster = WAVE_COMPOSITION[wave] ?? [];
    cursor = 0;
    timer = FIRST_SPAWN_DELAY;
    loadedWave = wave;
  }

  // A spread-out spawn lane on the spawn line.
  function spawnLaneZ(): number {
    const half = YARD_HALF_DEPTH - SPAWN_DEPTH_MARGIN;
    return (Math.random() * 2 - 1) * half;
  }

  return {
    update(dt, wave, status) {
      // Re-arm on the welcome screen / countdown; no spawning there.
      if (status === "idle" || status === "countdown") {
        loadedWave = 0;
        return;
      }
      // Freeze unless playing.
      if (status !== "playing") return;

      if (wave !== loadedWave) loadWave(wave);
      if (cursor >= roster.length) return;

      // Release enemies whose scheduled time has arrived this frame.
      timer -= dt;
      while (timer <= 0 && cursor < roster.length) {
        const type = roster[cursor];
        manager.spawn(type, { x: SPAWN_X, z: spawnLaneZ() });
        cursor += 1;
        if (cursor < roster.length) timer += SPAWN_INTERVAL[roster[cursor]];
      }
    },

    isRosterComplete(wave) {
      return loadedWave === wave && roster.length > 0 && cursor >= roster.length;
    },
  };
}
