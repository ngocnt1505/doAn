// The React↔store bridge. Creates one GameStore for the gameplay tree (provider),
// then lets components read slices of state reactively and dispatch actions via
// useSyncExternalStore — no Redux/Zustand dependency.

"use client";

import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createStore, type GameStore } from "@/core/gameStore";
import type { GameState, GameStatus } from "@/types/game";

const GameStoreContext = createContext<GameStore | null>(null);

// Owns the single store for the gameplay tree (created once, survives re-renders).
export function GameStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  return (
    <GameStoreContext.Provider value={storeRef.current}>
      {children}
    </GameStoreContext.Provider>
  );
}

// Reach the store itself — used to dispatch actions.
export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error("useGameStore must be used within a <GameStoreProvider>");
  }
  return store;
}

// Subscribe to a derived slice of state. Return primitives or stable references
// so the component re-renders only when the selected value changes.
export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const store = useGameStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

// The whole state object (stable reference between dispatches).
export const useGameState = (): GameState => useGameSelector((s) => s);

// Just the lifecycle status — overlays gate on this to avoid re-rendering each TICK.
export const useGameStatus = (): GameStatus => useGameSelector((s) => s.status);
