// Factory for the "X" target the player drops by clicking the ground. Plain data,
// no Three.js — the renderer turns it into a visible marker. Only one at a time.

import type { GroundPos, TargetMarker } from "@/types/entity";

// Create a target marker at a ground position.
export function createTargetMarker(pos: GroundPos): TargetMarker {
  return { pos: { ...pos } };
}
