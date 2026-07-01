// The initial "blank world" the reducer falls back to on START_GAME / RESTART /
// RETURN_TO_MENU.

import type { GameState } from "@/types/game";
import { COUNTDOWN_SECONDS, HOUSE_MAX_HP } from "@/core/constants";

// A fresh game state.
export const initialState = (): GameState => ({
  status: "idle",
  wave: 1,
  weapon: "basic",
  weaponsUnlocked: ["basic"],
  attackCount: 0,
  weaponCooldown: 0,
  elapsed: 0,
  countdown: COUNTDOWN_SECONDS,
  waveTransition: 0,
  waveClearTimer: null,
  spawnedThisWave: 0,
  player: { hp: HOUSE_MAX_HP },
  enemies: [],
  bullets: [],
  marker: null,
  playerName: null,
});
