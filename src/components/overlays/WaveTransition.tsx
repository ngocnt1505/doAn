// Between-wave transition message (status "transition"): a large "Wave N" for the
// upcoming wave, held for a few seconds. The reducer owns the timing.

"use client";

import { useGameSelector } from "@/hooks/useGameStore";

export default function WaveTransition() {
  const status = useGameSelector((s) => s.status);
  const wave = useGameSelector((s) => s.wave);

  if (status !== "transition") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
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
