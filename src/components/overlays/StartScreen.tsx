// Welcome overlay (status "idle"): title, objective, and a name prompt with two
// ways to start — "Play with name" (recorded) or "Pass" (anonymous) — plus a
// "View leaderboard" toggle.

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Leaderboard from "@/components/Leaderboard";
import { useGameStatus, useGameStore } from "@/hooks/useGameStore";

const MAX_NAME_LENGTH = 20;
// Remember the last name across sessions so the player needn't retype it.
const NAME_STORAGE_KEY = "houseDefense.playerName";

export default function StartScreen() {
  const status = useGameStatus();
  const { dispatch } = useGameStore();
  const [name, setName] = useState("");
  const [showBoard, setShowBoard] = useState(false);

  // Prefill from the last name used on this device.
  useEffect(() => {
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  if (status !== "idle") return null;

  const trimmed = name.trim();

  const playWithName = () => {
    if (!trimmed) return;
    localStorage.setItem(NAME_STORAGE_KEY, trimmed);
    dispatch({ type: "START_GAME", name: trimmed });
  };

  const playAnonymously = () => {
    dispatch({ type: "START_GAME" });
  };

  return (
    <div className="animate-overlay-in absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <Panel className="mx-4 max-w-lg p-10 text-center">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">
          3D House Defense
        </h1>
        <p className="mb-6 text-zinc-300">
          Defend the house at the center of the battlefield against three waves
          of incoming monsters. Click the ground to fire your cannon, lead your
          shots, and unlock stronger weapons after every wave.
        </p>

        {showBoard ? (
          <div className="mb-6">
            <Leaderboard className="max-h-72 overflow-y-auto" />
          </div>
        ) : (
          <div className="mb-6 text-left">
            <label
              htmlFor="player-name"
              className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-400"
            >
              Your name (for the leaderboard)
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") playWithName();
              }}
              placeholder="Enter a name…"
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none"
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!showBoard && (
            <>
              <Button onClick={playWithName} disabled={!trimmed}>
                Play with name
              </Button>
              <Button variant="secondary" onClick={playAnonymously}>
                Pass (play anonymously)
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowBoard((v) => !v)}>
            {showBoard ? "Back" : "View leaderboard"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
