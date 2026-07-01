// The enemy state machine: SPAWNING → MOVING → DEAD. This file owns only the
// transitions; movement lives in movementSystem.ts.

import type { Enemy } from "@/types/entity";

// Run the automatic transitions one step. The only automatic edge is
// SPAWNING → MOVING; MOVING → DEAD is triggered explicitly when killed.
export function advanceEnemyStates(enemies: Enemy[]): Enemy[] {
  return enemies.map((enemy) =>
    enemy.state === "spawning" ? { ...enemy, state: "moving" } : enemy,
  );
}
