/* =============================================================================
 * src/app/page.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The landing page of the app (route: `/`). Acts as a simple entry/menu
 *   screen that links into the actual game route.
 *
 * WHY IT EXISTS
 *   Most production apps separate a marketing/landing surface from the
 *   interactive surface. Here we keep it intentionally small so the focus
 *   stays on the game architecture itself.
 *
 * WHAT BELONGS HERE
 *   - Static or lightweight UI that introduces the project
 *   - Links to other routes (e.g. `/game`)
 *
 * WHAT DOES NOT BELONG HERE
 *   - Three.js, the game loop, or any heavy client-only logic — those live
 *     under `/game`
 *   - Global providers — those go in `layout.tsx`
 * ============================================================================= */

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-12 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        3D Interactive App
      </h1>
      <p className="max-w-xl text-zinc-400">
        A thesis-grade reference architecture for a state-driven Three.js
        game built on Next.js. Open the game route to see the rendering
        pipeline, game loop and systems wired together.
      </p>

      <Link
        href="/game"
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
      >
        Enter the game
      </Link>
    </main>
  );
}
