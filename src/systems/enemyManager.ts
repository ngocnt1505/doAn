// The spawn system: a thin controller over the store that owns enemy creation,
// so the store stays the single source of truth.

import type { GameStore } from "@/core/gameStore";
import type { Enemy, EnemyType, GroundPos } from "@/types/entity";
import { createEnemy } from "@/entities/Enemy";

export interface EnemyManager {
  spawn: (type: EnemyType, pos: GroundPos) => Enemy;
}

export function createEnemyManager(store: GameStore): EnemyManager {
  return {
    // Build an enemy and dispatch SPAWN_ENEMY.
    spawn(type, pos) {
      const enemy = createEnemy(type, pos);
      store.dispatch({ type: "SPAWN_ENEMY", enemy });
      return enemy;
    },
  };
}
