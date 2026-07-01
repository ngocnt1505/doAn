// The gameplay surface (route "/game"). Owns the single game store and layers the
// whole UI over the full-screen <GameCanvas>. Each overlay reads `status` from the
// shared store and shows itself only for the matching state.

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
import { ScoreSubmissionProvider } from "@/hooks/useSubmitScore";

export default function GamePage() {
  return (
    <GameStoreProvider>
      {/* Watches for game end and records the run on the leaderboard (once). */}
      <ScoreSubmissionProvider>
        <main className="relative h-screen w-screen overflow-hidden">
          <GameCanvas />

          <HUD />
          <ControlPanel />

          {/* State-driven overlays — each renders only for its status. */}
          <StartScreen />
          <Countdown />
          <PauseScreen />
          <WaveRewardScreen />
          <WaveTransition />
          <WinScreen />
          <LoseScreen />
        </main>
      </ScoreSubmissionProvider>
    </GameStoreProvider>
  );
}
