/* =============================================================================
 * src/components/ui/Panel.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Reusable bordered, translucent container. Gives every overlay card and the
 *   HUD/control panel the same "glass over the 3D scene" look without repeating
 *   the styling (SRS Maintainability).
 * ============================================================================= */

import type { HTMLAttributes } from "react";

export default function Panel({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md ${className}`}
      {...rest}
    />
  );
}
