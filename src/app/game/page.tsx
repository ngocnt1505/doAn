/* =============================================================================
 * src/app/game/page.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The `/game` route. Composes the interactive surface from a small set of
 *   high-level components: the Three.js canvas, the HUD overlay, the control
 *   panel, and the state-driven overlays (start / pause / win / lose).
 *
 * WHY IT EXISTS
 *   This file is the "wiring layer". It does not own game logic or rendering —
 *   it just decides WHICH components are on screen. That clean composition
 *   makes the architecture easy to follow at a glance.
 *
 * WHAT BELONGS HERE
 *   - JSX composition of the canvas, HUD and overlays
 *   - Whatever React-level layout (positioning, z-index) the game surface
 *     needs
 *
 * WHAT DOES NOT BELONG HERE
 *   - Three.js setup → `src/lib/threeSetup.ts`
 *   - Game state → `src/core/`
 *   - Per-system logic → `src/systems/`
 *
 * NOTE
 *   This route is rendered as a Client Component (see "use client" below)
 *   because Three.js and the game loop only exist in the browser.
 * ============================================================================= */

"use client";

import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import ControlPanel from "@/components/ControlPanel";
import StartScreen from "@/components/overlays/StartScreen";
import PauseScreen from "@/components/overlays/PauseScreen";
import WinScreen from "@/components/overlays/WinScreen";
import LoseScreen from "@/components/overlays/LoseScreen";

export default function GamePage() {
  return (
    /* `relative` lets absolutely-positioned overlays stack on top of the
     * canvas. The canvas itself fills the parent. */
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <GameCanvas />

      {/* HUD = always-on read-out (score, health, etc.) */}
      <HUD />

      {/* Side panel for designer-style controls (sliders, toggles) */}
      <ControlPanel />

      {/* Overlays render conditionally based on game state. Each one decides
       * for itself whether it should be visible by reading the store. */}
      <StartScreen />
      <PauseScreen />
      <WinScreen />
      <LoseScreen />
    </main>
  );
}
