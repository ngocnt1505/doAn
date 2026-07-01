// A tiny framework-free store wrapping the reducer. Holds the current GameState,
// exposes dispatch, and lets listeners subscribe to changes.

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

    // Run the reducer; notify listeners only on a real state change.
    dispatch(action) {
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
