// A single home for the magic numbers that govern the simulation: world size,
// timing, combat and camera tuning.

// Time
// Soft cap on delta-time (seconds) so a backgrounded tab can't fast-forward.
export const MAX_DELTA = 1 / 15;

// Lifecycle
// The pre-play sequence shown one label per second, then Countdown → Playing.
export const COUNTDOWN_LABELS = ["3", "2", "1", "Ready"] as const;
// Total seconds the countdown runs = one second per label.
export const COUNTDOWN_SECONDS = COUNTDOWN_LABELS.length;
// Starting health of the house (defeat is positional, not HP-based).
export const HOUSE_MAX_HP = 100;
// The game runs for exactly three waves; victory follows Wave 3.
export const TOTAL_WAVES = 3;
// Seconds the between-wave "Wave N" transition message stays up.
export const WAVE_TRANSITION_SECONDS = 3;
// Grace period (seconds) after the last enemy leaves before a wave is cleared.
export const WAVE_CLEAR_DELAY = 3;

// World / battlefield zones along x (house / weapon strip / yard); depth is z.
// Depth of the play field (z extent) — the width the house front spans.
export const YARD_DEPTH = 32;
export const YARD_HALF_DEPTH = YARD_DEPTH / 2;
// Gap between the house's right edge and the weapon strip.
export const HOUSE_GAP = 0;
// House front = defensive boundary; left edge of the weapon strip.
export const DEFENSE_LINE_X = -20;
// Right edge of the weapon strip = left edge of the yard.
export const YARD_START_X = -11;
// Enemy spawn line = right edge of the yard.
export const SPAWN_X = 26;
// Cannon position inside the weapon strip.
export const WEAPON_X = -16;
// Muzzle height where projectiles are born.
export const MUZZLE_Y = 1.4;
// Projectile birth point (the weapon position), outside the yard.
export const WEAPON_ORIGIN = { x: WEAPON_X, y: MUZZLE_Y, z: 0 } as const;

// Projectile flight
// Default flight time (per-weapon values live in weapons.ts).
export const BULLET_FLIGHT_TIME = 1.1;
// Downward gravity for the ballistic arc (world units / s²).
export const BULLET_GRAVITY = -22;
// Seconds a landed bullet lingers before it's destroyed.
export const BULLET_LINGER = 1;
// A bullet's full lifetime (flight + linger).
export const BULLET_REMOVE_TIME = BULLET_FLIGHT_TIME + BULLET_LINGER;

// Combat / area-of-effect damage
// Blast radius R (world units): damage fades linearly to zero at this distance.
export const BLAST_RADIUS = 6;

// Overall half-extent used to size the sun's shadow camera.
export const BATTLEFIELD_HALF = 50;

// Scenery tuning
export const GROUND_COLOR = 0x1d2a1c;
export const YARD_COLOR = 0x3c6e47;
export const STRIP_COLOR = 0x6b6f76;
// Yaw so the house model's front faces the yard (+x).
export const HOUSE_ROTATION_Y = Math.PI / 2;
// Yaw so the cannon faces the yard (+x).
export const WEAPON_ROTATION_Y = -Math.PI / 2;
// Rendered cannon size (x extent), in world units.
export const WEAPON_WIDTH = 2.5;
// Uniform scale applied to each fence segment before tiling.
export const FENCE_SCALE = 3;

// Camera — placed high and behind the near edge, looking down on the field.
// CAMERA_POS = [x, y, z] world position; CAMERA_LOOK = focal target; FOV in deg.
export const CAMERA_POS: readonly [number, number, number] = [1, 44, 60];
export const CAMERA_LOOK: readonly [number, number, number] = [1, 2, -2];
export const CAMERA_FOV = 25;
