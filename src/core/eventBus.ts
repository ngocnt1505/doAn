/* =============================================================================
 * src/core/eventBus.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A tiny publish/subscribe channel for transient events that don't belong
 *   in game state: "enemy died", "bullet hit", "wave complete", etc.
 *
 * WHY IT EXISTS
 *   Some things are not STATE, they are NOTIFICATIONS — they happen once
 *   and then they are gone. Putting them in the store would muddy the
 *   reducer and force systems to track "did I already handle this?".
 *
 *   The event bus is the right place for:
 *     - sound effects ("play hit.wav")
 *     - particle bursts
 *     - analytics
 *
 *   State is "what is true now"; events are "what just happened".
 *
 * WHAT BELONGS HERE
 *   - Channel definitions (typed payloads)
 *   - emit / on / off helpers
 *
 * WHAT DOES NOT BELONG HERE
 *   - Anything that persists across frames — put it in the store
 *   - Direct DOM manipulation
 * ============================================================================= */

/** Catalogue of events and their payload shapes. */
export interface GameEvents {
  "enemy:killed":  { enemyId: string; byOwnerId: string };
  "bullet:hit":    { bulletId: string; targetId: string };
  "wave:complete": { wave: number };
  "player:hit":    { amount: number };
}

type Handler<E extends keyof GameEvents> = (payload: GameEvents[E]) => void;

/** One bucket of handlers per event name. The outer map is `unknown`-typed
 *  internally because TS can't relate the key to the bucket's payload type
 *  through a single index access; the public functions narrow it back. */
const handlers = new Map<keyof GameEvents, Set<(payload: unknown) => void>>();

function bucket<E extends keyof GameEvents>(event: E): Set<Handler<E>> {
  let set = handlers.get(event);
  if (!set) {
    set = new Set();
    handlers.set(event, set);
  }
  return set as unknown as Set<Handler<E>>;
}

export function on<E extends keyof GameEvents>(event: E, fn: Handler<E>) {
  bucket(event).add(fn);
  return () => off(event, fn);
}

export function off<E extends keyof GameEvents>(event: E, fn: Handler<E>) {
  bucket(event).delete(fn);
}

export function emit<E extends keyof GameEvents>(
  event: E,
  payload: GameEvents[E],
) {
  bucket(event).forEach((fn) => fn(payload));
}
