/* =============================================================================
 * src/app/game/page.tsx  (route: "/game")
 * -----------------------------------------------------------------------------
 * The gameplay surface. Mounts the full-screen <GameCanvas> (the React↔Three
 * bridge). The HUD, control panel and overlay screens will be layered on top
 * here in later phases.
 * ============================================================================= */

import GameCanvas from "@/components/GameCanvas";

export default function GamePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <GameCanvas />
    </main>
  );
}
