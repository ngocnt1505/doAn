/* =============================================================================
 * src/components/ui/Slider.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A thin styled wrapper around <input type="range"> with a label.
 *
 * WHY IT EXISTS
 *   The control panel will eventually need sliders (difficulty, music
 *   volume). Putting the primitive here keeps it reusable and ensures
 *   visual consistency.
 *
 * WHAT BELONGS HERE / NOT
 *   - YES: presentation, controlled value + onChange callback
 *   - NO: knowledge of the store or actions
 * ============================================================================= */

"use client";

import type { ChangeEvent } from "react";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}

export default function Slider({
  label, value, min, max, step = 1, onChange,
}: SliderProps) {
  const handle = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(e.target.value));

  return (
    <label className="pointer-events-auto block">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="uppercase tracking-widest">{label}</span>
        <span className="font-mono text-zinc-200">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handle}
        className="mt-1 w-full accent-white"
      />
    </label>
  );
}
