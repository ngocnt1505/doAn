/* =============================================================================
 * src/core/gameStore.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A tiny in-memory store that holds the current GameState and notifies
 *   subscribers when it changes. Exposes:
 *     - getState()              : read the current state synchronously
 *     - dispatch(action)        : run the action through the reducer
 *     - subscribe(fn)           : be notified after every state change
 *     - useGameStore(selector)  : React hook for components
 *
 * WHY IT EXISTS
 *   The game loop runs at 60 FPS — far too fast for React state updates.
 *   So we keep the "fast path" (loop ↔ systems ↔ store) outside of React,
 *   and let React components subscribe via `useSyncExternalStore` only to
 *   the slices they actually display.
 *
 *   This is the same pattern as Zustand / Redux, intentionally written
 *   from scratch so the thesis can describe the mechanism end-to-end.
 *
 * WHAT BELONGS HERE
 *   - The store itself and its hook
 *   - Helpers tied to subscription
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer → `reducer.ts`
 *   - Game loop scheduling → `gameLoop.ts`
 *   - Inter-system messaging → `eventBus.ts`
 * ============================================================================= */

import { useSyncExternalStore } from "react";
import type { GameState } from "@/types/game";
import type { GameAction } from "@/types/actions";
import { reducer } from "./reducer";
import { initialState } from "./state";

type Listener = () => void;

let state: GameState = initialState();
const listeners: Set<Listener> = new Set();

/** Synchronous read of the current state. Used by systems and the loop. */
export function getState(): GameState {
  return state;
}

/** Run an action through the reducer and notify subscribers. */
export function dispatch(action: GameAction): void {
  const next = reducer(state, action);
  if (next === state) return; // No-op: skip the notification round-trip.
  state = next;
  listeners.forEach((fn) => fn());
}

/** Subscribe to every state change. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* -------------------------------------------------------------------------- */
/* React binding                                                              */
/* -------------------------------------------------------------------------- */

/**
 * React hook. Pass a selector that picks the slice your component cares
 * about; the component only re-renders when that slice's reference
 * changes (default `Object.is` equality).
 *
 *   const score = useGameStore((s) => s.score);
 */
export function useGameStore<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state), // server snapshot — same as client because the
                          //   route is a client component
  );
}
