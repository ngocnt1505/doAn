/* =============================================================================
 * src/components/ui/Panel.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A frosted-glass container used to group HUD-adjacent UI elements
 *   (control panel, overlay cards).
 *
 * WHY IT EXISTS
 *   The same surface treatment shows up in several places. Centralising
 *   it here means one place to tweak the visual language.
 *
 * WHAT BELONGS HERE / NOT
 *   - YES: layout / surface styling
 *   - NO: game logic
 * ============================================================================= */

"use client";

import type { ReactNode } from "react";

export interface PanelProps {
  children: ReactNode;
  className?: string;
}

export default function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`pointer-events-auto flex flex-col gap-3 rounded-xl border border-white/10 bg-black/55 p-4 text-white backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
