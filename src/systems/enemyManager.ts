/* =============================================================================
 * src/systems/enemyManager.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The spawn system (Milestone 3). A thin controller over the store that owns
 *   enemy creation/removal, so callers get a simple manager API while the store
 *   stays the single source of truth:
 *
 *       enemyManager.spawn("easy", { x, z });   // → dispatch SPAWN_ENEMY
 *       enemyManager.remove(id);                 // → dispatch REMOVE_ENEMY
 *       enemyManager.getEnemies();               // → state.enemies
 *
 *   (Vanilla equivalent of an `EnemyManager` class — the actual enemy array
 *   lives in game state, the render system mirrors it to the scene.)
 * ============================================================================= */

import type { GameStore } from "@/core/gameStore";
import type { Enemy, EnemyType, GroundPos } from "@/types/entity";
import { createEnemy } from "@/entities/Enemy";

export interface EnemyManager {
  spawn: (type: EnemyType, pos: GroundPos) => Enemy;
  remove: (id: string) => void;
  damage: (id: string, amount: number) => void;
  getEnemies: () => Enemy[];
}

export function createEnemyManager(store: GameStore): EnemyManager {
  return {
    spawn(type, pos) {
      const enemy = createEnemy(type, pos);
      store.dispatch({ type: "SPAWN_ENEMY", enemy });
      return enemy;
    },
    remove(id) {
      store.dispatch({ type: "REMOVE_ENEMY", id });
    },
    damage(id, amount) {
      store.dispatch({ type: "DAMAGE_ENEMY", id, amount });
    },
    getEnemies() {
      return store.getState().enemies;
    },
  };
}
