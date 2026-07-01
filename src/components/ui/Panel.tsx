// Reusable bordered, translucent container — the "glass over the 3D scene" look
// shared by overlay cards and the HUD.

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
