/* =============================================================================
 * src/app/page.tsx  (route: "/")
 * -----------------------------------------------------------------------------
 * The landing / welcome surface. Kept intentionally small — it introduces the
 * game and links into the interactive `/game` route. The Welcome Screen UI
 * (SRS FR-1) will be fleshed out in a later phase.
 * ============================================================================= */

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-12 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">3D House Defense</h1>
      <p className="max-w-xl text-zinc-400">
        Defend the house from three waves of incoming monsters. Aim with the
        mouse, lead your shots, and upgrade your weapon after every wave.
      </p>
      <Link
        href="/game"
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
      >
        Start Game
      </Link>
    </main>
  );
}
