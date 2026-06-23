# 3D House Defense

A browser-based interactive 3D tower-defense game built with **Next.js**, **React**,
**TypeScript**, and **Three.js / WebGL**. The player defends a house at the edge of
the battlefield against three escalating waves of monsters, aiming and firing a
cannon with the mouse and unlocking stronger weapons after each wave.

See [`docs/SRS document.md`](docs/SRS%20document.md) for the full Software
Requirements Specification.

## Getting Started

```bash
npm install
npm run dev      # dev server at http://localhost:3000 (redirects to /game)
```

Other scripts:

```bash
npm run build    # production build (also runs the TypeScript type-check)
npm run start    # serve the production build
npm run lint     # ESLint
```

Requirements: a modern desktop browser with WebGL, and Node.js 18+.

## How to Play

- Click anywhere on the **green yard** to fire the cannon at that spot. Projectiles
  arc and deal **area-of-effect** damage — enemies nearer the impact take more.
- Each weapon **reloads** between shots (see the bar under "Weapon" in the HUD) and
  fires a stronger **Big Shot** (red projectile) at a fixed interval.
- Clear a wave to **unlock the next weapon**; choose *Use now* or *Continue* on the
  reward screen, or switch anytime from the **Weapons** picker in the HUD.
- You **lose** if any monster reaches the house, and **win** by clearing all three
  waves.
- On the start screen, enter a **name** to have your run recorded on the
  **leaderboard**, or **Pass** to play anonymously. After each game the board shows
  where you placed.

## Leaderboard & API

Finished runs are stored in a small SQLite leaderboard, exposed through a Next.js
Route Handler at [`/api/scores`](src/app/api/scores/route.ts) — the browser talks to
it over `fetch` (see [`scoresApi.ts`](src/lib/scoresApi.ts)); only server code
touches the database, behind [`db.ts`](src/lib/db.ts).

| Method | Route | Purpose |
| ------ | ----- | ------- |
| `GET`  | `/api/scores?limit=N` | Ranked leaderboard (default 20 rows). |
| `POST` | `/api/scores` | Record a run: `{ name, timeMs, waveReached, won }`. |

**Ranking:** players who clear all three waves rank first, ordered by fastest time;
everyone else is grouped by how far they reached (wave 3 → 2 → 1), newest first.

**Storage:** a local SQLite file at `data/leaderboard.sqlite` (gitignored, created
on first write) via `better-sqlite3`. The schema lives in `db.ts`. Because all DB
access is isolated there, swapping to a hosted database (e.g. for a Vercel deploy,
where the serverless filesystem is not persistent) is a single-file change — the
API contract and UI are unaffected.

## Architecture

The app follows a layered, state-driven architecture (UI → State → Systems →
Rendering). React is a thin shell; the game itself is **vanilla Three.js** driven by
a Redux-style store. Only [`GameCanvas`](src/components/GameCanvas.tsx) bridges React
and Three.js.

```
Input → Dispatch Action → Reducer → Update State → Run Systems → Render Scene
```

- **State** ([`src/core`](src/core)) — `GameState` is the single source of truth,
  held in a framework-free store and mutated only by the pure
  [`reducer`](src/core/reducer.ts) via typed [`actions`](src/types/actions.ts).
  Tuning lives in [`constants.ts`](src/core/constants.ts) and
  [`weapons.ts`](src/core/weapons.ts).
- **Systems** ([`src/systems`](src/systems)) — gameplay logic: spawn scheduling,
  movement, collision/AoE damage, shooting, wave progression, and the renderers
  that mirror state onto Three.js objects.
- **Entities** ([`src/entities`](src/entities)) — plain-data/factory helpers
  (`Enemy`, `Bullet`, `TargetMarker`, `HealthBar`, `ImpactEffect`).
- **Rendering** ([`src/lib`](src/lib)) — Three.js context, camera, lighting,
  scenery, raycasting, and the GLB model cache.
- **UI** ([`src/components`](src/components)) — HUD, control panel, and the
  state-driven overlays (welcome, countdown, pause, wave reward/transition,
  win, lose).

### State flow

`idle → countdown → playing ⇄ paused`, then `playing → reward → transition →
playing` between waves, and finally `playing → win` or `playing → lose`. Overlays
render purely from `status`.

### 3D assets

GLB models live in [`public/models`](public/models) and are mapped to logical keys
in [`src/lib/models.ts`](src/lib/models.ts). They are preloaded once and cloned per
instance (skinned meshes via `SkeletonUtils`) by
[`modelCache.ts`](src/lib/modelCache.ts).

## Performance & resource management

- Renderer pixel ratio capped at 2; PCF soft shadows; clamped frame delta-time to
  prevent fast-forward after a backgrounded tab.
- Models are loaded once and cloned, never re-fetched per spawn.
- Entities are cleaned up when spent (bullets after their lifetime, enemies after
  their death animation), and all geometries/materials are disposed on unmount.

## Tech Stack

Next.js · React · TypeScript · Three.js · WebGL · Tailwind CSS · GLTF/GLB
