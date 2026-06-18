/* =============================================================================
 * src/components/ui/Button.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Reusable styled button primitive shared by every overlay and the control
 *   panel, so action buttons (Start, Resume, Restart, …) look and behave
 *   consistently (SRS Maintainability: minimise UI duplication).
 * ============================================================================= */

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-zinc-200",
  secondary: "border border-white/15 bg-white/10 text-white hover:bg-white/20",
};

export default function Button({
  variant = "primary",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
