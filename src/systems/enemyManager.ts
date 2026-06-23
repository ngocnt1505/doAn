/* =============================================================================
 * src/systems/enemyManager.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The spawn system (Milestone 3). A thin controller over the store that owns
 *   enemy creation, so callers get a simple manager API while the store stays the
 *   single source of truth:
 *
 *       enemyManager.spawn("easy", { x, z });   // → dispatch SPAWN_ENEMY
 *
 *   (Vanilla equivalent of an `EnemyManager` class — the actual enemy array
 *   lives in game state, the render system mirrors it to the scene.)
 * ============================================================================= */

import type { GameStore } from "@/core/gameStore";
import type { Enemy, EnemyType, GroundPos } from "@/types/entity";
import { createEnemy } from "@/entities/Enemy";

export interface EnemyManager {
  spawn: (type: EnemyType, pos: GroundPos) => Enemy;
}

export function createEnemyManager(store: GameStore): EnemyManager {
  return {
    spawn(type, pos) {
      const enemy = createEnemy(type, pos);
      store.dispatch({ type: "SPAWN_ENEMY", enemy });
      return enemy;
    },
  };
}
