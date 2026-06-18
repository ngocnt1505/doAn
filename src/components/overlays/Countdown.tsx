/* =============================================================================
 * src/components/overlays/Countdown.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The pre-play countdown sequence (SRS FR-3): renders "3" → "2" → "1" →
 *   "Ready", one per second, while status is "countdown". The reducer owns the
 *   timing (it decrements `countdown` each TICK and flips to Playing at 0); this
 *   component only maps the remaining seconds to the label to display.
 *
 *   Mapping: with COUNTDOWN_LABELS.length seconds total, the label index is
 *   (length - ceil(remaining)), so 4s→"3", 3s→"2", 2s→"1", 1s→"Ready".
 * ============================================================================= */

"use client";

import { COUNTDOWN_LABELS } from "@/core/constants";
import { useGameSelector } from "@/hooks/useGameStore";

export default function Countdown() {
  const status = useGameSelector((s) => s.status);
  const countdown = useGameSelector((s) => s.countdown);

  if (status !== "countdown") return null;

  const index = COUNTDOWN_LABELS.length - Math.ceil(countdown);
  const label = COUNTDOWN_LABELS[Math.min(Math.max(index, 0), COUNTDOWN_LABELS.length - 1)];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {/* keyed by label so each new value re-mounts and replays the pop animation */}
      <span
        key={label}
        className="countdown-pop text-7xl font-bold tracking-wide text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]"
      >
        {label}
      </span>
    </div>
  );
}
