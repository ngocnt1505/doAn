/* =============================================================================
 * src/systems/spawnSystem.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Acts on "spawn requests" produced by other systems (today: just the
 *   wave system) and creates the corresponding entities.
 *
 * WHY IT EXISTS
 *   Splitting "decide WHAT to spawn" (waveSystem) from "actually CREATE the
 *   entity" (this system) means we can swap difficulty curves without
 *   touching entity construction, and vice-versa.
 *
 * WHAT BELONGS HERE
 *   - Reading queued spawn intents and dispatching SPAWN actions
 *   - Limiting concurrent entities (optional cap)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Deciding wave size / cadence (`waveSystem.ts`)
 *   - Entity geometry / data shape (`src/entities/*`)
 *
 * NOTE
 *   Spawning currently runs on a simple internal queue. This is intentional:
 *   it keeps actions for "real" gameplay events and avoids polluting the
 *   reducer with per-frame request bookkeeping.
 * ============================================================================= */

import { dispatch } from "@/core/gameStore";
import { createEnemyEntity } from "@/entities/Enemy";
import type { Vec3 } from "@/types/entity";

interface EnemySpawnRequest {
  kind: "enemy";
  position: Vec3;
}

const queue: EnemySpawnRequest[] = [];

/** Other systems call this to request a spawn. Cheap, synchronous. */
export function requestEnemySpawn(position: Vec3): void {
  queue.push({ kind: "enemy", position });
}

export function spawnSystem(_dt: number): void {
  if (queue.length === 0) return;

  // Drain the queue in one frame. We could rate-limit this with a "max per
  // frame" cap if waves get very large.
  while (queue.length > 0) {
    const req = queue.shift()!;
    if (req.kind === "enemy") {
      dispatch({ type: "SPAWN", entity: createEnemyEntity(req.position) });
    }
  }

  // TODO: support bullet spawn via the same queue once shootingSystem grows.
  // TODO: respect a global entity cap for performance.
}
