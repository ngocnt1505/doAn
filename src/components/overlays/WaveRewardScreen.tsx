/* =============================================================================
 * src/components/overlays/WaveRewardScreen.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Weapon-reward overlay (Phase 7). Shown while status is "reward": a wave has
 *   been cleared and the next weapon just unlocked (SRS FR-25). It tells the
 *   player which weapon they earned and offers two choices:
 *     - "Use now"  → switch to the new weapon immediately (RESOLVE_REWARD useNew)
 *     - "Continue" → keep the current weapon (it stays unlocked for the picker)
 *   Either choice starts the 3-second wave transition before the next wave
 *   (SRS FR-24). This intentionally overrides SRS BR-94 (auto-activate) so the
 *   player decides, per the project requirement.
 * ============================================================================= */

"use client";

import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import { useGameState, useGameStore } from "@/hooks/useGameStore";
import { WEAPONS, WEAPON_ORDER } from "@/core/weapons";

export default function WaveRewardScreen() {
  const { status, wave } = useGameState();
  const { dispatch } = useGameStore();

  if (status !== "reward") return null;

  // Clearing wave N unlocks WEAPON_ORDER[N] (wave is still the cleared number
  // here — it's incremented when the reward is resolved).
  const unlocked = WEAPON_ORDER[wave];
  const spec = unlocked ? WEAPONS[unlocked] : null;
  if (!spec) return null;

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <Panel className="mx-4 w-[26rem] max-w-full p-10 text-center">
        <p className="mb-1 text-xs uppercase tracking-widest text-zinc-400">
          Wave {wave} cleared
        </p>
        <h2 className="mb-3 text-3xl font-semibold tracking-tight text-amber-300">
          New weapon unlocked!
        </h2>
        <p className="mb-1 text-xl font-semibold text-white">
          {spec.label} Cannon
        </p>
        <p className="mb-8 text-sm text-zinc-300">
          {spec.damage} damage
          {spec.projectiles > 1 ? ` ×${spec.projectiles} shots` : ""} · Big Shot{" "}
          {spec.bigShotDamage} every {spec.bigShotEvery}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => dispatch({ type: "RESOLVE_REWARD", useNew: true })}>
            Use now
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "RESOLVE_REWARD", useNew: false })}
          >
            Continue
          </Button>
        </div>
      </Panel>
    </div>
  );
}
