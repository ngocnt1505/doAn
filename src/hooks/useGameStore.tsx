/* =============================================================================
 * src/hooks/useGameStore.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The React↔store bridge. Creates ONE GameStore for the whole gameplay tree
 *   (provider), then lets any component read slices of state reactively and
 *   dispatch actions. This is how the UI Layer talks to the State Management
 *   Layer (SRS Architecture Overview): the canvas, HUD, control panel and
 *   overlays all share a single source of truth.
 *
 * WHY IT EXISTS
 *   The store (`src/core/gameStore.ts`) is framework-free. This file is the thin
 *   adapter that wires its subscribe/getState into React via
 *   `useSyncExternalStore`, so components re-render exactly when the slice they
 *   read changes — and no Redux/Zustand dependency is introduced (thesis goal).
 *
 * WHAT BELONGS HERE
 *   - The provider that owns the store instance
 *   - Hooks to read state (selectors) and reach the store for dispatch
 *
 * WHAT DOES NOT BELONG HERE
 *   - Reducer logic (→ `reducer.ts`), the frame loop (→ `gameLoop.ts`)
 *   - Any Three.js / rendering concern (→ `GameCanvas`)
 * ============================================================================= */

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

/** Owns the single store for the gameplay tree. Created once (useRef) so the
 *  store survives re-renders; everything below it shares this instance. */
export function GameStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  return (
    <GameStoreContext.Provider value={storeRef.current}>
      {children}
    </GameStoreContext.Provider>
  );
}

/** Reach the store itself — used to `dispatch` actions (Start, Pause, …). */
export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error("useGameStore must be used within a <GameStoreProvider>");
  }
  return store;
}

/** Subscribe to a derived slice of state. The component re-renders only when the
 *  selected value changes (Object.is). IMPORTANT: return primitives or stable
 *  references — a selector that builds a new object every call re-renders every
 *  frame. For several fields at once, prefer `useGameState()`. */
export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const store = useGameStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

/** The whole state object. Its reference is stable between dispatches, so this
 *  is safe and convenient for components that read many fields (HUD). */
export const useGameState = (): GameState => useGameSelector((s) => s);

/** Just the lifecycle status — overlays gate on this so they don't re-render on
 *  every TICK. */
export const useGameStatus = (): GameStatus => useGameSelector((s) => s.status);
