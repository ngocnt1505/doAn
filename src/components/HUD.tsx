/* =============================================================================
 * src/components/HUD.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Heads-up display (SRS FR-30 Wave Information, FR-31 Gameplay Timer). A thin
 *   top bar that reflects the current wave, elapsed play time and active weapon.
 *   It reads live state from the store, so it updates immediately on any change
 *   (wave transition, tick) and freezes when the game is paused — because the
 *   reducer stops advancing `elapsed` outside the Playing state.
 *
 *   It also hosts the Weapons button: a popup that lets the player switch between
 *   UNLOCKED weapons (SRS FR-25); locked weapons are shown disabled.
 *
 *   Visible during the active session (countdown / playing / paused / reward /
 *   transition); hidden on the welcome and end screens, which present their own UI.
 * ============================================================================= */

"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";
import { TOTAL_WAVES } from "@/core/constants";
import { WEAPONS, WEAPON_ORDER } from "@/core/weapons";
import { useGameState, useGameStore } from "@/hooks/useGameStore";

/** Whole seconds → "m:ss" (FR-31: timer updates every second). */
function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

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
  const { status, wave, elapsed, weapon, weaponsUnlocked, weaponCooldown } =
    useGameState();
  const { dispatch } = useGameStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reload progress: 100% = ready to fire, lower while the weapon reloads.
  const reloadPct =
    weaponCooldown <= 0
      ? 100
      : (1 - weaponCooldown / WEAPONS[weapon].reloadTime) * 100;

  const active =
    status === "countdown" ||
    status === "playing" ||
    status === "paused" ||
    status === "reward" ||
    status === "transition";
  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4">
      {/* While the picker is open, a transparent full-screen backdrop catches the
          next click: it closes the popup AND swallows the click so it can't reach
          the canvas underneath (no stray marker / shot when clicking outside). */}
      {pickerOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-10"
          onClick={() => setPickerOpen(false)}
        />
      )}
      <div className="pointer-events-auto relative z-20">
        <Panel className="flex items-center divide-x divide-white/10 px-2 py-2">
          <Stat label="Wave" value={`${wave} / ${TOTAL_WAVES}`} />
          <Stat label="Time" value={formatTime(elapsed)} />
          <div className="flex flex-col items-center px-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">
              Weapon
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {WEAPONS[weapon].label}
            </span>
            {/* Reload bar: fills green as the weapon reloads, full = ready. */}
            <div className="mt-1 h-1 w-16 overflow-hidden rounded bg-white/15">
              <div
                className={`h-full ${reloadPct >= 100 ? "bg-emerald-400" : "bg-amber-400"}`}
                style={{ width: `${reloadPct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center pl-3">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              ⚔ Weapons
            </button>
          </div>
        </Panel>

        {pickerOpen && (
          <Panel className="absolute right-0 top-full mt-2 w-64 p-2">
            <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
              Select weapon
            </p>
            <div className="flex flex-col gap-1">
              {WEAPON_ORDER.map((level) => {
                const spec = WEAPONS[level];
                const unlocked = weaponsUnlocked.includes(level);
                const isActive = level === weapon;
                return (
                  <button
                    key={level}
                    disabled={!unlocked}
                    onClick={() => {
                      dispatch({ type: "SELECT_WEAPON", weapon: level });
                      setPickerOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                      isActive
                        ? "bg-white text-black"
                        : unlocked
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    <span className="font-medium">{spec.label}</span>
                    <span className="text-xs opacity-70">
                      {isActive ? "Active" : unlocked ? `${spec.damage} dmg` : "Locked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
