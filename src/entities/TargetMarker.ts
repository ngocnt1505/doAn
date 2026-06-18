/* =============================================================================
 * src/entities/TargetMarker.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Phase 5 · Milestone 3 — Target Marker (entity).
 *   Factory for the "X" target the player drops by clicking the ground
 *   (SRS FR-15 step 5/6). Plain data, no Three.js — the renderer turns it into a
 *   visible marker. Only one marker exists at a time; clicking again replaces it.
 * ============================================================================= */

import type { GroundPos, TargetMarker } from "@/types/entity";

/** Create a target marker at a ground position. */
export function createTargetMarker(pos: GroundPos): TargetMarker {
  return { pos: { ...pos } };
}
