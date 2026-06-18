/* =============================================================================
 * src/components/HUD.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Heads-up display (SRS FR-30 Wave Information, FR-31 Gameplay Timer). A thin
 *   top bar that reflects the current wave, elapsed play time, score and active
 *   weapon. It reads live state from the store, so it updates immediately on any
 *   change (wave transition, tick) and freezes when the game is paused — because
 *   the reducer stops advancing `elapsed` outside the Playing state.
 *
 *   Visible during the active session (countdown / playing / paused); hidden on
 *   the welcome and end screens, which present their own UI.
 * ============================================================================= */

"use client";

import Panel from "@/components/ui/Panel";
import { TOTAL_WAVES } from "@/core/constants";
import { useGameState } from "@/hooks/useGameStore";

/** Whole seconds → "m:ss" (FR-31: timer updates every second). */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const WEAPON_LABELS: Record<string, string> = {
  basic: "Basic",
  medium: "Medium",
  advanced: "Advanced",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-4">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400">
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default function HUD() {
  const { status, wave, elapsed, score, weapon } = useGameState();

  const active =
    status === "countdown" || status === "playing" || status === "paused";
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4">
      <Panel className="pointer-events-auto flex items-center divide-x divide-white/10 px-2 py-2">
        <Stat label="Wave" value={`${wave} / ${TOTAL_WAVES}`} />
        <Stat label="Time" value={formatTime(elapsed)} />
        <Stat label="Score" value={String(score)} />
        <Stat label="Weapon" value={WEAPON_LABELS[weapon] ?? weapon} />
      </Panel>
    </div>
  );
}
