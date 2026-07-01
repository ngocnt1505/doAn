// Unit tests for the pure state-transition function (src/core/reducer.ts): the
// lifecycle, combat guards, positional defeat, and wave completion / victory.

import { describe, it, expect } from "vitest";
import { reducer } from "@/core/reducer";
import { initialState } from "@/core/state";
import type { GameState } from "@/types/game";
import { createEnemy } from "@/entities/Enemy";
import { GOAL_X } from "@/systems/movementSystem";
import { WEAPONS } from "@/core/weapons";
import { rosterSize } from "@/core/waves";
import {
  COUNTDOWN_SECONDS,
  WAVE_CLEAR_DELAY,
  WAVE_TRANSITION_SECONDS,
  TOTAL_WAVES,
} from "@/core/constants";

// A minimal "playing" world, with optional field overrides.
function playing(overrides: Partial<GameState> = {}): GameState {
  return { ...initialState(), status: "playing", ...overrides };
}

// A moving enemy at a chosen x (defaults to the spawn side, far from the house).
function movingEnemyAt(x: number): GameState["enemies"][number] {
  return { ...createEnemy("easy", { x, z: 0 }), state: "moving" };
}

describe("START_GAME", () => {
  it("moves idle → countdown and captures a trimmed name", () => {
    const next = reducer(initialState(), { type: "START_GAME", name: "  Alice  " });
    expect(next.status).toBe("countdown");
    expect(next.playerName).toBe("Alice");
  });

  it("treats a blank or missing name as anonymous (null)", () => {
    expect(reducer(initialState(), { type: "START_GAME", name: "   " }).playerName).toBeNull();
    expect(reducer(initialState(), { type: "START_GAME" }).playerName).toBeNull();
  });
});

describe("countdown TICK", () => {
  it("counts down and flips to playing when it elapses", () => {
    const s = playing({ status: "countdown", countdown: COUNTDOWN_SECONDS });
    const mid = reducer(s, { type: "TICK", dt: 1 });
    expect(mid.status).toBe("countdown");
    expect(mid.countdown).toBe(COUNTDOWN_SECONDS - 1);

    const done = reducer(mid, { type: "TICK", dt: COUNTDOWN_SECONDS });
    expect(done.status).toBe("playing");
    expect(done.countdown).toBe(0);
  });
});

describe("FIRE_SHOT guards (SRS FR-15/FR-16)", () => {
  it("is ignored when not playing", () => {
    const s = initialState();
    expect(reducer(s, { type: "FIRE_SHOT", target: { x: 0, z: 0 } })).toBe(s);
  });

  it("is ignored while reloading (weaponCooldown > 0)", () => {
    const s = playing({ weaponCooldown: 1 });
    expect(reducer(s, { type: "FIRE_SHOT", target: { x: 0, z: 0 } })).toBe(s);
  });

  it("fires one projectile, starts the reload and drops the marker", () => {
    const s = playing();
    const next = reducer(s, { type: "FIRE_SHOT", target: { x: 3, z: -2 } });
    expect(next.bullets).toHaveLength(1);
    expect(next.bullets[0].damage).toBe(WEAPONS.basic.damage);
    expect(next.bullets[0].isBigShot).toBe(false);
    expect(next.weaponCooldown).toBe(WEAPONS.basic.reloadTime);
    expect(next.attackCount).toBe(1);
    expect(next.marker).not.toBeNull();
  });

  it("fires a Big Shot on the Nth attack and resets the counter", () => {
    const s = playing({ attackCount: WEAPONS.basic.bigShotEvery });
    const next = reducer(s, { type: "FIRE_SHOT", target: { x: 0, z: 0 } });
    expect(next.bullets[0].isBigShot).toBe(true);
    expect(next.bullets[0].damage).toBe(WEAPONS.basic.bigShotDamage);
    expect(next.attackCount).toBe(0);
  });
});

describe("DAMAGE_ENEMY (SRS BR-31/32/33)", () => {
  it("subtracts health but keeps a survivor moving", () => {
    const enemy = movingEnemyAt(10); // easy → 100 HP
    const s = playing({ enemies: [enemy] });
    const next = reducer(s, { type: "DAMAGE_ENEMY", id: enemy.id, amount: 30 });
    expect(next.enemies[0].health).toBe(70);
    expect(next.enemies[0].state).toBe("moving");
  });

  it("clamps to 0 and marks the enemy dead", () => {
    const enemy = movingEnemyAt(10);
    const s = playing({ enemies: [enemy] });
    const next = reducer(s, { type: "DAMAGE_ENEMY", id: enemy.id, amount: 999 });
    expect(next.enemies[0].health).toBe(0);
    expect(next.enemies[0].state).toBe("dead");
  });

  it("ignores damage to an already-dead enemy (no state change)", () => {
    const enemy = { ...movingEnemyAt(10), state: "dead" as const, health: 0 };
    const s = playing({ enemies: [enemy] });
    expect(reducer(s, { type: "DAMAGE_ENEMY", id: enemy.id, amount: 10 })).toBe(s);
  });
});

describe("positional defeat (SRS FR-29 / BR-104/105)", () => {
  it("loses the instant a moving enemy reaches the house line", () => {
    const s = playing({ enemies: [movingEnemyAt(GOAL_X)] });
    const next = reducer(s, { type: "MOVE_ENEMIES", dt: 0.016 });
    expect(next.status).toBe("lose");
  });

  it("does not lose while the enemy is still short of the house", () => {
    const s = playing({ enemies: [movingEnemyAt(GOAL_X + 10)] });
    const next = reducer(s, { type: "MOVE_ENEMIES", dt: 0.016 });
    expect(next.status).toBe("playing");
  });
});

describe("wave completion decided in the reducer (SRS FR-23 / FR-31)", () => {
  it("arms the grace timer only once the roster is spawned and the field is empty", () => {
    // Roster not fully spawned yet → no grace, still playing.
    const partial = reducer(
      playing({ wave: 1, spawnedThisWave: 1, enemies: [] }),
      { type: "TICK", dt: 0.1 },
    );
    expect(partial.waveClearTimer).toBeNull();
    expect(partial.status).toBe("playing");

    // Whole roster spawned and cleared → the grace timer arms.
    const armed = reducer(
      playing({ wave: 1, spawnedThisWave: rosterSize(1), enemies: [] }),
      { type: "TICK", dt: 0.1 },
    );
    expect(armed.waveClearTimer).toBe(WAVE_CLEAR_DELAY);
    expect(armed.status).toBe("playing");
  });

  it("opens the reward overlay and unlocks the next weapon after the grace (non-final wave)", () => {
    let s = playing({ wave: 1, spawnedThisWave: rosterSize(1), enemies: [] });
    s = reducer(s, { type: "TICK", dt: 0.1 }); // arm
    s = reducer(s, { type: "TICK", dt: WAVE_CLEAR_DELAY }); // elapse
    expect(s.status).toBe("reward");
    expect(s.weaponsUnlocked).toContain("medium");
    expect(s.waveClearTimer).toBeNull();
  });

  it("wins after clearing the final wave", () => {
    let s = playing({ wave: TOTAL_WAVES, spawnedThisWave: rosterSize(TOTAL_WAVES), enemies: [] });
    s = reducer(s, { type: "TICK", dt: 0.1 }); // arm
    s = reducer(s, { type: "TICK", dt: WAVE_CLEAR_DELAY }); // elapse
    expect(s.status).toBe("win");
  });

  it("cancels a pending grace if an enemy reappears on the field", () => {
    const s = playing({
      wave: 1,
      spawnedThisWave: rosterSize(1),
      enemies: [movingEnemyAt(10)],
      waveClearTimer: 2,
    });
    const next = reducer(s, { type: "TICK", dt: 0.1 });
    expect(next.waveClearTimer).toBeNull();
    expect(next.status).toBe("playing");
  });
});

describe("SPAWN_ENEMY counts toward the wave roster", () => {
  it("increments spawnedThisWave", () => {
    const s = playing({ spawnedThisWave: 0 });
    const next = reducer(s, { type: "SPAWN_ENEMY", enemy: movingEnemyAt(26) });
    expect(next.spawnedThisWave).toBe(1);
    expect(next.enemies).toHaveLength(1);
  });
});

describe("RESOLVE_REWARD advances the wave and re-arms the roster", () => {
  it("keeps the current weapon on Continue and resets the spawn counter", () => {
    const s = playing({
      status: "reward",
      wave: 1,
      spawnedThisWave: rosterSize(1),
      weaponsUnlocked: ["basic", "medium"],
    });
    const next = reducer(s, { type: "RESOLVE_REWARD", useNew: false });
    expect(next.status).toBe("transition");
    expect(next.wave).toBe(2);
    expect(next.weapon).toBe("basic");
    expect(next.spawnedThisWave).toBe(0);
    expect(next.waveTransition).toBe(WAVE_TRANSITION_SECONDS);
  });

  it("switches to the unlocked weapon on Use now", () => {
    const s = playing({
      status: "reward",
      wave: 1,
      spawnedThisWave: rosterSize(1),
      weaponsUnlocked: ["basic", "medium"],
    });
    const next = reducer(s, { type: "RESOLVE_REWARD", useNew: true });
    expect(next.weapon).toBe("medium");
  });
});

describe("PAUSE / RESUME (SRS FR-26)", () => {
  it("pauses from playing and cancels any wave-clear grace", () => {
    const s = playing({ waveClearTimer: 1.5 });
    const next = reducer(s, { type: "PAUSE" });
    expect(next.status).toBe("paused");
    expect(next.waveClearTimer).toBeNull();
  });

  it("is a no-op (same reference) when not playing", () => {
    const s = initialState();
    expect(reducer(s, { type: "PAUSE" })).toBe(s);
  });

  it("resumes from paused", () => {
    const s = playing({ status: "paused" });
    expect(reducer(s, { type: "RESUME" }).status).toBe("playing");
  });
});

describe("purity", () => {
  it("does not mutate the input state on FIRE_SHOT", () => {
    const s = playing();
    const bulletsBefore = s.bullets;
    const next = reducer(s, { type: "FIRE_SHOT", target: { x: 1, z: 1 } });
    expect(next).not.toBe(s); // new object
    expect(s.bullets).toBe(bulletsBefore); // original array untouched
    expect(s.bullets).toHaveLength(0);
  });
});
