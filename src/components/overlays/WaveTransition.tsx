/* =============================================================================
 * src/components/overlays/WaveTransition.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Between-wave transition message (SRS FR-24). Shown while status is
 *   "transition": a large "Wave N" announcing the UPCOMING wave (BR-88), held
 *   for 3 seconds (BR-89) while no enemies spawn (BR-90). The reducer owns the
 *   timing (it counts `waveTransition` down each TICK and flips to Playing at 0);
 *   this component only renders the message.
 * ============================================================================= */

"use client";

import { useGameSelector } from "@/hooks/useGameStore";

export default function WaveTransition() {
  const status = useGameSelector((s) => s.status);
  const wave = useGameSelector((s) => s.wave);

  if (status !== "transition") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
      <span className="mb-2 text-sm uppercase tracking-[0.3em] text-zinc-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
        Get ready
      </span>
      {/* keyed by wave so the pop animation replays on each transition */}
      <span
        key={wave}
        className="countdown-pop text-7xl font-bold tracking-wide text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]"
      >
        Wave {wave}
      </span>
    </div>
  );
}
