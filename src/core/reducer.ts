// The pure state-transition function: (state, action) → state. No side effects.
// This is the only place GameState changes.

import type { GameAction } from "@/types/actions";
import type { GameState } from "@/types/game";
import { initialState } from "@/core/state";
import { moveEnemies, GOAL_X } from "@/systems/movementSystem";
import { moveBullets } from "@/systems/bulletSystem";
import { advanceEnemyStates } from "@/systems/enemyState";
import { createTargetMarker } from "@/entities/TargetMarker";
import { createBullet } from "@/entities/Bullet";
import { WEAPONS, WEAPON_ORDER, TWIN_SHOT_SPREAD } from "@/core/weapons";
import {
  WEAPON_ORIGIN,
  WAVE_TRANSITION_SECONDS,
  WAVE_CLEAR_DELAY,
  TOTAL_WAVES,
} from "@/core/constants";
import { rosterSize } from "@/core/waves";

// Shared transition for a cleared non-final wave: unlock the next weapon and
// open the reward overlay.
function enterReward(state: GameState): GameState {
  const unlocked = WEAPON_ORDER[state.wave];
  const weaponsUnlocked =
    unlocked && !state.weaponsUnlocked.includes(unlocked)
      ? [...state.weaponsUnlocked, unlocked]
      : state.weaponsUnlocked;
  return { ...state, status: "reward", weaponsUnlocked, waveClearTimer: null };
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // Start a fresh session in the countdown; capture the leaderboard name.
    case "START_GAME": {
      const name = action.name?.trim();
      return {
        ...initialState(),
        status: "countdown",
        playerName: name ? name : null,
      };
    }

    // Pause: freeze play and cancel any pending wave-clear grace.
    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused", waveClearTimer: null };

    // Resume from pause.
    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "playing" };

    case "WIN":
      return { ...state, status: "win" };

    case "LOSE":
      return { ...state, status: "lose" };

    // Restart: fresh state back into the countdown, keeping the name.
    case "RESTART":
      return { ...initialState(), status: "countdown", playerName: state.playerName };

    case "RETURN_TO_MENU":
      return initialState();

    // Add a new enemy and count it toward this wave's roster.
    case "SPAWN_ENEMY":
      return {
        ...state,
        enemies: [...state.enemies, action.enemy],
        spawnedThisWave: state.spawnedThisWave + 1,
      };

    case "REMOVE_ENEMY":
      return {
        ...state,
        enemies: state.enemies.filter((e) => e.id !== action.id),
      };

    // Per-frame enemy update: advance the state machine, move MOVING enemies,
    // and lose the instant one reaches the house line.
    case "MOVE_ENEMIES": {
      if (state.status !== "playing" || state.enemies.length === 0) return state;
      const enemies = moveEnemies(advanceEnemyStates(state.enemies), action.dt);

      const breached = enemies.some(
        (e) => e.state === "moving" && e.pos.x <= GOAL_X + 1e-3,
      );
      if (breached) return { ...state, enemies, status: "lose" };

      return { ...state, enemies };
    }

    // Reduce one enemy's health; mark it dead at zero.
    case "DAMAGE_ENEMY": {
      let changed = false;
      const enemies = state.enemies.map((e) => {
        if (e.id !== action.id || e.state === "dead") return e;
        changed = true;
        const health = Math.max(0, Math.min(e.maxHealth, e.health - action.amount));
        const state = health <= 0 ? ("dead" as const) : e.state;
        return { ...e, health, state };
      });
      return changed ? { ...state, enemies } : state;
    }

    case "CLEAR_TARGET":
      return state.marker ? { ...state, marker: null } : state;

    // Fire the active weapon: build projectile(s), advance the Big Shot counter,
    // start the reload. Ignored while not playing or still reloading.
    case "FIRE_SHOT": {
      if (state.status !== "playing" || state.weaponCooldown > 0) return state;

      const spec = WEAPONS[state.weapon];
      const isBigShot = state.attackCount >= spec.bigShotEvery;
      const damage = isBigShot ? spec.bigShotDamage : spec.damage;

      const bullets = [...state.bullets];
      for (let i = 0; i < spec.projectiles; i++) {
        const zOffset =
          spec.projectiles > 1
            ? (i - (spec.projectiles - 1) / 2) * 2 * TWIN_SHOT_SPREAD
            : 0;
        bullets.push(
          createBullet(
            WEAPON_ORIGIN,
            { x: action.target.x, y: 0, z: action.target.z + zOffset },
            damage,
            spec.flightTime,
            isBigShot,
          ),
        );
      }

      return {
        ...state,
        bullets,
        attackCount: isBigShot ? 0 : state.attackCount + 1,
        weaponCooldown: spec.reloadTime,
        marker: createTargetMarker(action.target),
      };
    }

    // Switch the active weapon from the HUD picker (only if unlocked).
    case "SELECT_WEAPON": {
      if (
        action.weapon === state.weapon ||
        !state.weaponsUnlocked.includes(action.weapon)
      ) {
        return state;
      }
      return { ...state, weapon: action.weapon, attackCount: 0, weaponCooldown: 0 };
    }

    // A non-final wave is done: unlock the next weapon and open the reward overlay.
    case "WAVE_CLEARED": {
      if (state.status !== "playing") return state;
      return enterReward(state);
    }

    // Player closed the reward overlay: adopt or keep the weapon, then run the
    // between-wave transition before the next wave.
    case "RESOLVE_REWARD": {
      if (state.status !== "reward") return state;
      const unlocked = WEAPON_ORDER[state.wave];
      const weapon = action.useNew && unlocked ? unlocked : state.weapon;
      return {
        ...state,
        weapon,
        attackCount: weapon !== state.weapon ? 0 : state.attackCount,
        weaponCooldown: 0,
        wave: state.wave + 1,
        status: "transition",
        waveTransition: WAVE_TRANSITION_SECONDS,
        spawnedThisWave: 0,
        waveClearTimer: null,
      };
    }

    // Advance bullets along their arc (only while playing).
    case "MOVE_BULLETS": {
      if (state.status !== "playing" || state.bullets.length === 0) return state;
      return { ...state, bullets: moveBullets(state.bullets, action.dt) };
    }

    // Time step. Advances countdown / elapsed / reload, and decides wave
    // completion and victory from state.
    case "TICK": {
      // Countdown: flip to playing when it elapses.
      if (state.status === "countdown") {
        const countdown = state.countdown - action.dt;
        if (countdown <= 0) return { ...state, countdown: 0, status: "playing" };
        return { ...state, countdown };
      }
      // Active play: advance timers, then detect a cleared wave.
      if (state.status === "playing") {
        const base: GameState = {
          ...state,
          elapsed: state.elapsed + action.dt,
          weaponCooldown: Math.max(0, state.weaponCooldown - action.dt),
        };

        // A wave is clear once its whole roster has spawned and no enemy remains.
        const size = rosterSize(base.wave);
        const fieldClear =
          size > 0 && base.spawnedThisWave >= size && base.enemies.length === 0;
        if (!fieldClear) {
          return base.waveClearTimer === null ? base : { ...base, waveClearTimer: null };
        }

        // Run a short grace, then win (final wave) or open the reward overlay.
        const timer =
          base.waveClearTimer === null ? WAVE_CLEAR_DELAY : base.waveClearTimer - action.dt;
        if (timer > 0) return { ...base, waveClearTimer: timer };

        return base.wave >= TOTAL_WAVES
          ? { ...base, status: "win", waveClearTimer: null }
          : enterReward({ ...base, waveClearTimer: null });
      }
      // Between-wave transition: flip to playing when the message elapses.
      if (state.status === "transition") {
        const waveTransition = state.waveTransition - action.dt;
        if (waveTransition <= 0) {
          return { ...state, waveTransition: 0, status: "playing" };
        }
        return { ...state, waveTransition };
      }
      return state;
    }

    default:
      return state;
  }
}
