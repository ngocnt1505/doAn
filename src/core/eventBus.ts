/* =============================================================================
 * src/core/eventBus.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A tiny typed publish/subscribe channel for transient events that do NOT
 *   belong in game state: "enemy killed", "bullet hit", "wave complete"…
 *
 * WHY IT EXISTS
 *   Some things are not STATE, they are NOTIFICATIONS — they happen once and
 *   are gone (sound effects, particle bursts). State is "what is true now";
 *   events are "what just happened". Keeping them out of the reducer stops it
 *   from tracking "did I already handle this?".
 *
 * WHAT BELONGS HERE
 *   - The event catalogue (typed payloads) and emit / on helpers
 *
 * WHAT DOES NOT BELONG HERE
 *   - Anything that persists across frames — put it in the store
 * ============================================================================= */

import type { GroundPos } from "@/types/entity";

/** Catalogue of events and their payload shapes. Grows with the game. */
export interface GameEvents {
  /** Phase 5 · M4 — a shot was requested at a ground target (no bullet yet). */
  "shoot:requested": { target: GroundPos };
  /** Phase 6 — a bullet reached its target; `damage` is the weapon damage D to
   *  spread over nearby enemies as area-of-effect falloff (SRS FR-19 / FR-38).
   *  `big` marks a Big Shot so the impact VFX can render bigger/red (Phase 9). */
  "bullet:impact": {
    bulletId: string;
    x: number;
    z: number;
    damage: number;
    big: boolean;
  };
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void;
type AnyHandler = (payload: never) => void;

export function createEventBus() {
  // Stored loosely; the typed `on`/`emit` signatures below are the public
  // contract, so the per-event narrowing happens at the boundary.
  const handlers = new Map<keyof GameEvents, Set<AnyHandler>>();

  return {
    on<K extends keyof GameEvents>(event: K, handler: Handler<K>) {
      let set = handlers.get(event);
      if (!set) handlers.set(event, (set = new Set()));
      set.add(handler as AnyHandler);
      return () => handlers.get(event)?.delete(handler as AnyHandler);
    },
    emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
      handlers.get(event)?.forEach((h) => (h as Handler<K>)(payload));
    },
  };
}

export type EventBus = ReturnType<typeof createEventBus>;
