/* =============================================================================
 * src/core/gameStore.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A tiny framework-free store wrapping the reducer. Holds the current
 *   GameState, exposes `dispatch`, and lets listeners subscribe to changes.
 *
 * WHY IT EXISTS
 *   The SRS calls for a single source of truth driven by a reducer. Keeping the
 *   store dependency-free (no Redux/Zustand) makes the architecture obvious for
 *   a thesis. React components subscribe via a hook (`useGameStore`, later).
 *
 * WHAT BELONGS HERE
 *   - getState / dispatch / subscribe
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer logic (→ `reducer.ts`)
 *   - The frame loop (→ `gameLoop.ts`)
 * ============================================================================= */

import type { GameAction } from "@/types/actions";
import type { GameState } from "@/types/game";
import { reducer } from "@/core/reducer";
import { initialState } from "@/core/state";

export type Listener = (state: GameState) => void;

export interface GameStore {
  getState: () => GameState;
  dispatch: (action: GameAction) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore(initial: GameState = initialState()): GameStore {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,

    dispatch(action) {
      const next = reducer(state, action);
      if (next === state) return; // no-op transitions don't notify
      state = next;
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
