/* =============================================================================
 * src/types/actions.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The closed set of "things that can happen" to game state. Every state change
 *   goes through one of these actions and the reducer in `src/core/reducer.ts`.
 *
 * WHY IT EXISTS
 *   Limiting state changes to a known vocabulary is the core idea of reducers
 *   (Redux, useReducer…). It makes debugging trivial — you can log every action
 *   and replay it. Anything not in this union cannot legally modify state.
 *
 * WHAT BELONGS HERE
 *   - Discriminated union of action shapes
 *
 * WHAT DOES NOT BELONG HERE
 *   - The reducer itself → `src/core/reducer.ts`
 *   - Transient inter-system notifications → `src/core/eventBus.ts`
 * ============================================================================= */

/* ---------- Lifecycle actions (SRS State Diagram) ---------- */
interface StartGameAction { type: "START_GAME"; } // idle → countdown
interface BeginPlayAction { type: "BEGIN_PLAY"; } // countdown → playing
interface PauseAction { type: "PAUSE"; } // playing → paused
interface ResumeAction { type: "RESUME"; } // paused → playing
interface WinAction { type: "WIN"; } // playing → win
interface LoseAction { type: "LOSE"; } // playing → lose
interface RestartAction { type: "RESTART"; } // any → countdown (fresh)
interface ReturnToMenuAction { type: "RETURN_TO_MENU"; } // any → idle (fresh)

/* ---------- Tick-level actions ---------- */
/** Advances time by `dt` (seconds). Dispatched once per animation frame. */
interface TickAction { type: "TICK"; dt: number; }

/* ---------- The union ---------- */
/** Exhaustive union of all legal actions. TypeScript warns if the reducer
 *  forgets one. Gameplay actions (SPAWN, FIRE, APPLY_DAMAGE…) arrive later. */
export type GameAction =
  | StartGameAction
  | BeginPlayAction
  | PauseAction
  | ResumeAction
  | WinAction
  | LoseAction
  | RestartAction
  | ReturnToMenuAction
  | TickAction;
