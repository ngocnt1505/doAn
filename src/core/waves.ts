// The per-wave enemy roster as pure data, plus a helper for a wave's size.
// Both the spawn scheduler and the reducer read this.

import type { EnemyType } from "@/types/entity";

// Per-wave enemy roster, ordered easy → medium → hard.
export const WAVE_COMPOSITION: Record<number, EnemyType[]> = {
  1: ["easy", "easy", "medium"],
  2: ["easy", "easy", "medium", "medium", "hard"],
  3: ["easy", "easy", "medium", "medium", "hard", "hard", "hard"],
};

// How many enemies make up `wave`'s roster (0 for an unknown wave).
export function rosterSize(wave: number): number {
  return WAVE_COMPOSITION[wave]?.length ?? 0;
}
