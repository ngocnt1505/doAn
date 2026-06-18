/* =============================================================================
 * src/core/constants.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A single home for the magic numbers that govern the simulation: world size,
 *   timing, and (later) per-weapon / per-enemy tuning. Centralising them lets a
 *   reviewer tune gameplay without grepping the codebase.
 *
 * WHAT BELONGS HERE
 *   - Immutable tuning values shared across systems and rendering
 *
 * WHAT DOES NOT BELONG HERE
 *   - Runtime state (use the store)
 *   - Three.js objects (use `src/lib/threeSetup.ts`)
 *   - One-off values used by a single file (keep them local)
 * ============================================================================= */

/* ---------- Time ---------- */
/** Soft cap on delta-time (seconds) so a backgrounded tab can't fast-forward
 *  the simulation when it regains focus. */
export const MAX_DELTA = 1 / 15; // 66 ms

/* ---------- Lifecycle ---------- */
/** The pre-play sequence shown one label per second (SRS FR-3 / TR-1):
 *  "3" → "2" → "1" → "Ready". When the final label's second elapses, the machine
 *  flips Countdown → Playing. The extra 3-second delay before the FIRST enemy
 *  (SRS BR-23) belongs to the spawn system, not to this lifecycle countdown. */
export const COUNTDOWN_LABELS = ["3", "2", "1", "Ready"] as const;

/** Total seconds the countdown runs = one second per label. `state.countdown`
 *  holds the seconds remaining and starts here (SRS FR-2 / FR-3). */
export const COUNTDOWN_SECONDS = COUNTDOWN_LABELS.length;

/** Starting health of the protected house; defeat is reaching it, not HP. */
export const HOUSE_MAX_HP = 100;

/** The game runs for exactly three waves (SRS BR-74); victory follows Wave 3. */
export const TOTAL_WAVES = 3;

/* ---------- World / battlefield zones ----------
 * Player-POV layout (per the design sketch):
 *
 *   screen-left ─────────────────────────────────────────── screen-right
 *   [ HOUSE ] │ [ gray WEAPON strip ] │ [ green YARD — monsters only ] │ spawn
 *     -x  ······································································  +x
 *
 *   Action axis = x: enemies spawn at the RIGHT (+x) and advance LEFT toward the
 *     house. Depth axis = z: the "width" the house front spans and across which
 *     enemies distribute (SRS BR-12/BR-28). The camera looks down -z, so x maps
 *     to screen left/right. y = up.
 *
 *   The house may be cut off the left edge; the green yard is NEVER cut and
 *   keeps a margin from the bottom edge.
 */

/** Depth of the play field (z extent) — the SRS "width" the house front spans. */
export const YARD_DEPTH = 32;
export const YARD_HALF_DEPTH = YARD_DEPTH / 2;

/** Gap (world units) between the house's right edge and the gray weapon strip.
 *  0 = the gray strip's left edge touches the house. The house extends left from
 *  here and may be cut off-screen. */
export const HOUSE_GAP = 0;
/** House front = defensive boundary; left edge of the gray weapon strip. The
 *  house's right edge anchors here (minus HOUSE_GAP), so moving this slides the
 *  gray strip without moving the house when HOUSE_GAP compensates. */
export const DEFENSE_LINE_X = -20;
/** Right edge of the gray weapon strip = left edge of the green yard. */
export const YARD_START_X = -11;
/** Enemy spawn line = right edge of the green yard (SRS FR-9). */
export const SPAWN_X = 26;
/** Cannon position, inside the gray weapon strip — between house and yard. */
export const WEAPON_X = -16;

/** Overall half-extent used to size the sun's shadow camera to cover the field. */
export const BATTLEFIELD_HALF = 50;

/* ---------- Scenery tuning (safe to tweak after viewing) ---------- */
export const GROUND_COLOR = 0x1d2a1c; // neutral base under everything
export const YARD_COLOR = 0x3c6e47; // green monster yard
export const STRIP_COLOR = 0x6b6f76; // gray weapon zone
/** Yaw so the house model's front (door) faces the yard (+x, where monsters come
 *  from). If it still faces wrong, try -Math.PI / 2, Math.PI, or 0. */
export const HOUSE_ROTATION_Y = Math.PI / 2;
/** Yaw so the cannon faces the yard (+x). If wrong, try -Math.PI / 2 / Math.PI / 0. */
export const WEAPON_ROTATION_Y = -Math.PI / 2;
/** Rendered cannon size (x extent), in world units. */
export const WEAPON_WIDTH = 3;
/** Uniform scale applied to each fence segment before it is tiled. */
export const FENCE_SCALE = 3;

/* ---------- Camera (SRS FR-33) ---------- */
/* Camera configuration (used to construct the Three.js perspective camera).
 *
 * Coordinate system and intent:
 *  - World axes: x = left/right (player view), y = up, z = depth (camera looks
 *    down the -z axis). Positions are in world units used throughout the game.
 *  - The camera is placed high and behind the near edge so it "looks down"
 *    onto the play field. This frames the green yard with a bottom margin and
 *    intentionally allows the house to be partially cut off at the left.
 *
 * Constants:
 *  - `CAMERA_POS` = [x, y, z] world position of the camera. Increase `y` to
 *    raise the view, decrease `z` to zoom in, or shift `x` to pan left/right.
 *  - `CAMERA_LOOK` = [x, y, z] world target the camera points at. This is the
 *    focal point used to set the camera's lookAt target; small adjustments here
 *    change where the camera centers the scene without moving the camera body.
 *  - `CAMERA_FOV` = vertical field-of-view in degrees. Larger values widen the
 *    view (more of the scene visible), smaller values zoom in.
 *
 * Tuning tips:
 *  - To keep the yard fully visible while changing models, tweak `CAMERA_POS.z`
 *    (zoom) or `CAMERA_FOV` together rather than moving `y` alone.
 *  - For cinematic shots, animate `CAMERA_POS` and `CAMERA_LOOK` together so the
 *    framing remains stable.
 */
export const CAMERA_POS: readonly [number, number, number] = [1, 44, 60];
export const CAMERA_LOOK: readonly [number, number, number] = [1, 2, -2];
export const CAMERA_FOV = 25;
