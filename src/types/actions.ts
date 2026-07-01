// The closed set of "things that can happen" to game state. Every state change
// goes through one of these actions and the reducer.

import type { Enemy, GroundPos, WeaponLevel } from "./entity";

// Lifecycle actions.
interface StartGameAction { type: "START_GAME"; name?: string; }
interface PauseAction { type: "PAUSE"; }
interface ResumeAction { type: "RESUME"; }
interface WinAction { type: "WIN"; }
interface LoseAction { type: "LOSE"; }
interface RestartAction { type: "RESTART"; }
interface ReturnToMenuAction { type: "RETURN_TO_MENU"; }

// Advances time by `dt` (seconds), once per animation frame.
interface TickAction { type: "TICK"; dt: number; }

// Enemy spawn / removal.
interface SpawnEnemyAction { type: "SPAWN_ENEMY"; enemy: Enemy; }
interface RemoveEnemyAction { type: "REMOVE_ENEMY"; id: string; }

// Advance all enemies toward the house by `dt` seconds.
interface MoveEnemiesAction { type: "MOVE_ENEMIES"; dt: number; }

// Deal `amount` damage to one enemy.
interface DamageEnemyAction { type: "DAMAGE_ENEMY"; id: string; amount: number; }

// Shooting actions.
interface ClearTargetAction { type: "CLEAR_TARGET"; }
interface FireShotAction { type: "FIRE_SHOT"; target: GroundPos; }
interface MoveBulletsAction { type: "MOVE_BULLETS"; dt: number; }

// Wave / weapon progression.
interface WaveClearedAction { type: "WAVE_CLEARED"; }
interface ResolveRewardAction { type: "RESOLVE_REWARD"; useNew: boolean; }
interface SelectWeaponAction { type: "SELECT_WEAPON"; weapon: WeaponLevel; }

// Exhaustive union of all legal actions.
export type GameAction =
  | StartGameAction
  | PauseAction
  | ResumeAction
  | WinAction
  | LoseAction
  | RestartAction
  | ReturnToMenuAction
  | TickAction
  | SpawnEnemyAction
  | RemoveEnemyAction
  | MoveEnemiesAction
  | DamageEnemyAction
  | ClearTargetAction
  | FireShotAction
  | MoveBulletsAction
  | WaveClearedAction
  | ResolveRewardAction
  | SelectWeaponAction;
