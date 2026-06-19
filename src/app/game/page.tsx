/* =============================================================================
 * src/app/game/page.tsx  (route: "/game")
 * -----------------------------------------------------------------------------
 * The gameplay surface. Owns the single game store (via <GameStoreProvider>) and
 * layers the whole UI over the full-screen <GameCanvas>:
 *   - HUD + ControlPanel: live gameplay info and runtime controls
 *   - Overlays: Welcome, Countdown, Pause, Win, Lose
 * Every overlay/panel reads `status` from the shared store and shows itself only
 * for the matching state, so the screen always reflects the state machine
 * (SRS State Diagram): idle → countdown → playing ⇄ paused → win / lose.
 * ============================================================================= */

"use client";

import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import ControlPanel from "@/components/ControlPanel";
import StartScreen from "@/components/overlays/StartScreen";
import Countdown from "@/components/overlays/Countdown";
import PauseScreen from "@/components/overlays/PauseScreen";
import WaveRewardScreen from "@/components/overlays/WaveRewardScreen";
import WaveTransition from "@/components/overlays/WaveTransition";
import WinScreen from "@/components/overlays/WinScreen";
import LoseScreen from "@/components/overlays/LoseScreen";
import { GameStoreProvider } from "@/hooks/useGameStore";

export default function GamePage() {
  return (
    <GameStoreProvider>
      <main className="relative h-screen w-screen overflow-hidden">
        <GameCanvas />

        {/* HUD + runtime controls */}
        <HUD />
        <ControlPanel />

        {/* State-driven overlays — each renders only for its status */}
        <StartScreen />
        <Countdown />
        <PauseScreen />
        <WaveRewardScreen />
        <WaveTransition />
        <WinScreen />
        <LoseScreen />
      </main>
    </GameStoreProvider>
  );
}
