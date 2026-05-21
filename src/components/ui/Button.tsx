/* =============================================================================
 * src/components/ui/Button.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   A small reusable button used by overlays and the control panel.
 *
 * WHY IT EXISTS
 *   Keeps button styling consistent in one place. Components in `ui/` are
 *   PURE PRESENTATION — no game knowledge.
 *
 * WHAT BELONGS HERE / NOT
 *   - YES: visual variants, accessibility props
 *   - NO: dispatching actions or reading the store
 * ============================================================================= */

"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-zinc-200 active:bg-zinc-300",
  ghost:
    "bg-transparent text-zinc-100 border border-white/15 hover:bg-white/10",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`pointer-events-auto inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
