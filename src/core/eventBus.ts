// A tiny typed publish/subscribe channel for transient events that do not belong
// in game state (shot requested, bullet impact).

import type { GroundPos } from "@/types/entity";

// Catalogue of events and their payload shapes.
export interface GameEvents {
  // A shot was requested at a ground target.
  "shoot:requested": { target: GroundPos };
  // A bullet reached its target; `damage` is the weapon damage to spread as
  // area-of-effect falloff, `big` marks a Big Shot for bigger VFX.
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
  const handlers = new Map<keyof GameEvents, Set<AnyHandler>>();

  return {
    // Subscribe to an event; returns an unsubscribe function.
    on<K extends keyof GameEvents>(event: K, handler: Handler<K>) {
      let set = handlers.get(event);
      if (!set) handlers.set(event, (set = new Set()));
      set.add(handler as AnyHandler);
      return () => handlers.get(event)?.delete(handler as AnyHandler);
    },
    // Broadcast an event to its handlers.
    emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
      handlers.get(event)?.forEach((h) => (h as Handler<K>)(payload));
    },
  };
}

export type EventBus = ReturnType<typeof createEventBus>;
