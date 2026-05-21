/* =============================================================================
 * src/lib/helpers.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Catch-all bag of small generic utilities used in many places: id
 *   generation, clamping random ranges, formatting numbers for the HUD.
 *
 * WHY IT EXISTS
 *   Every project ends up with these. Putting them in one named place
 *   (rather than scattered in random files) keeps imports clean.
 *
 * WHAT BELONGS HERE
 *   - 5-line, dependency-free, domain-agnostic helpers
 *
 * WHAT DOES NOT BELONG HERE
 *   - Anything that would deserve its own module name (math.ts,
 *     raycasting.ts, etc.)
 *   - React, Three.js, or game-specific code
 * ============================================================================= */

/** A short unique-enough id for entities. Not crypto-secure — fine for runtime. */
let idCounter = 0;
export const uid = (prefix = "e"): string =>
  `${prefix}-${(++idCounter).toString(36)}`;

/** Random float in [min, max). */
export const randRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

/** Random integer in [min, max] inclusive. */
export const randInt = (min: number, max: number): number =>
  Math.floor(randRange(min, max + 1));

/** Format a score for the HUD: 12345 → "12,345". */
export const formatScore = (n: number): string => n.toLocaleString("en-US");
