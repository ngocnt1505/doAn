/* =============================================================================
 * src/core/reducer.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The pure state-transition function: (state, action) → state. No side
 *   effects, no Three.js, no DOM. This is the ONLY place GameState changes.
 *
 * WHY IT EXISTS
 *   A single reducer keeps the data flow predictable (SRS State Architecture):
 *   UI and systems dispatch actions, the reducer decides the next world.
 *
 * WHAT BELONGS HERE
 *   - One `switch` over the action union
 *   - Pure, deterministic transitions returning new state
 *
 * WHAT DOES NOT BELONG HERE
 *   - rAF / timers (→ `gameLoop.ts`)
 *   - Rendering, asset loading, input listening
 * ============================================================================= */

import type { GameAction } from "@/types/actions";
import type { GameState } from "@/types/game";
import { initialState } from "@/core/state";
import { moveEnemies, GOAL_X } from "@/systems/movementSystem";
import { moveBullets } from "@/systems/bulletSystem";
import { advanceEnemyStates } from "@/systems/enemyState";
import { createTargetMarker } from "@/entities/TargetMarker";
import { createBullet } from "@/entities/Bullet";
import { WEAPONS, WEAPON_ORDER, TWIN_SHOT_SPREAD } from "@/core/weapons";
import { WEAPON_ORIGIN, WAVE_TRANSITION_SECONDS } from "@/core/constants";

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      // Begin a brand-new session from the welcome screen (SRS FR-2).
      return { ...initialState(), status: "countdown" };

    case "BEGIN_PLAY":
      if (state.status !== "countdown") return state;
      return { ...state, status: "playing" };

    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused" };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "playing" };

    case "WIN":
      return { ...state, status: "win" };

    case "LOSE":
      return { ...state, status: "lose" };

    case "RESTART":
      // Fresh state, straight back into the countdown (SRS FR-28).
      return { ...initialState(), status: "countdown" };

    case "RETURN_TO_MENU":
      return initialState();

    case "SPAWN_ENEMY":
      // Append a new enemy to the world (Milestone 3 spawn system).
      return { ...state, enemies: [...state.enemies, action.enemy] };

    case "REMOVE_ENEMY":
      return {
        ...state,
        enemies: state.enemies.filter((e) => e.id !== action.id),
      };

    case "MOVE_ENEMIES": {
      // Per-frame enemy update: advance the state machine (SPAWNING → MOVING)
      // then move the MOVING ones. DEAD enemies stay in state (frozen) so the
      // renderer can play their fall animation; they're removed via REMOVE_ENEMY
      // once that finishes. Gated to Playing so movement freezes on Pause / win /
      // lose (SRS FR-26 / BR-96: no gameplay updates while paused).
      if (state.status !== "playing" || state.enemies.length === 0) return state;
      const enemies = moveEnemies(advanceEnemyStates(state.enemies), action.dt);

      // Defeat (SRS FR-29 / BR-104/105): the instant any living enemy reaches the
      // house front (the defensive boundary, GOAL_X), the game is lost. Movement
      // clamps enemies AT GOAL_X, so an enemy that got there has breached it.
      const breached = enemies.some(
        (e) => e.state === "moving" && e.pos.x <= GOAL_X + 1e-3,
      );
      if (breached) return { ...state, enemies, status: "lose" };

      return { ...state, enemies };
    }

    case "DAMAGE_ENEMY": {
      // SRS BR-31 (lose health), BR-32 (clamp 0..max), BR-33 (destroy at 0).
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

    case "SET_TARGET":
      // Drop (or move) the single "X" target the player clicked (SRS FR-15).
      return { ...state, marker: createTargetMarker(action.pos) };

    case "CLEAR_TARGET":
      // Hide the "X" — used the instant a bullet reaches it (M9).
      return state.marker ? { ...state, marker: null } : state;

    case "FIRE_BULLET":
      // Add a pre-built projectile to the world (legacy/debug path).
      return { ...state, bullets: [...state.bullets, action.bullet] };

    case "FIRE_SHOT": {
      // Only fire while Playing (SRS FR-15 precondition) and when the weapon has
      // finished reloading (BR-130..132) — clicks during reload are ignored.
      if (state.status !== "playing" || state.weaponCooldown > 0) return state;

      // Fire the active weapon at the clicked target (SRS FR-16/FR-18). The Big
      // Shot counter only advances on NORMAL attacks (BR-63); reaching the
      // weapon's interval makes THIS shot a Big Shot and resets the counter
      // (BR-64). Advanced fires two projectiles, spread apart in depth (BR-45/57).
      const spec = WEAPONS[state.weapon];
      const isBigShot = state.attackCount >= spec.bigShotEvery;
      const damage = isBigShot ? spec.bigShotDamage : spec.damage;

      const bullets = [...state.bullets];
      for (let i = 0; i < spec.projectiles; i++) {
        // Centre a single shot; spread a twin shot to ±TWIN_SHOT_SPREAD in z.
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
        weaponCooldown: spec.reloadTime, // start the reload (BR-130..132)
        marker: createTargetMarker(action.target),
      };
    }

    case "SELECT_WEAPON": {
      // Switch the active weapon from the HUD picker — only if it's unlocked
      // (SRS FR-25). Switching resets the Big Shot counter (per-weapon, BR-62).
      if (
        action.weapon === state.weapon ||
        !state.weaponsUnlocked.includes(action.weapon)
      ) {
        return state;
      }
      // Switching weapons resets the Big Shot counter and the reload (ready now).
      return { ...state, weapon: action.weapon, attackCount: 0, weaponCooldown: 0 };
    }

    case "WAVE_CLEARED": {
      // A non-final wave is done: unlock the next weapon and open the reward
      // overlay (SRS FR-23/FR-25). Wave 3 completion is handled as WIN instead.
      if (state.status !== "playing") return state;
      const unlocked = WEAPON_ORDER[state.wave]; // clearing wave N unlocks [N]
      const weaponsUnlocked =
        unlocked && !state.weaponsUnlocked.includes(unlocked)
          ? [...state.weaponsUnlocked, unlocked]
          : state.weaponsUnlocked;
      return { ...state, status: "reward", weaponsUnlocked };
    }

    case "RESOLVE_REWARD": {
      // Player closed the reward overlay. "Use now" activates the just-unlocked
      // weapon; "Continue" keeps the current one (it stays unlocked). Then run
      // the 3s wave transition before the next wave (SRS FR-24).
      if (state.status !== "reward") return state;
      const unlocked = WEAPON_ORDER[state.wave];
      const weapon = action.useNew && unlocked ? unlocked : state.weapon;
      return {
        ...state,
        weapon,
        attackCount: weapon !== state.weapon ? 0 : state.attackCount,
        weaponCooldown: 0, // start the next wave ready to fire
        wave: state.wave + 1, // the transition shows this upcoming number
        status: "transition",
        waveTransition: WAVE_TRANSITION_SECONDS,
      };
    }

    case "MOVE_BULLETS": {
      // Advance bullets along their arc (M7/M8). Gated to Playing so projectiles
      // freeze on pause / win / lose (SRS FR-26 / BR-96).
      if (state.status !== "playing" || state.bullets.length === 0) return state;
      return { ...state, bullets: moveBullets(state.bullets, action.dt) };
    }

    case "TICK": {
      // Time only advances during the countdown and active play.
      if (state.status === "countdown") {
        const countdown = state.countdown - action.dt;
        // When the countdown elapses, the machine flips itself to Playing
        // (SRS FR-3) — no external trigger needed.
        if (countdown <= 0) return { ...state, countdown: 0, status: "playing" };
        return { ...state, countdown };
      }
      if (state.status === "playing") {
        return {
          ...state,
          elapsed: state.elapsed + action.dt,
          // Tick down the weapon reload (BR-130..132); clamp at 0 = ready.
          weaponCooldown: Math.max(0, state.weaponCooldown - action.dt),
        };
      }
      if (state.status === "transition") {
        // Count down the between-wave message; flip to Playing when it elapses so
        // the spawn scheduler starts the next wave (SRS FR-24 / BR-89).
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
