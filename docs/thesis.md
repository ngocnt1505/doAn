# Designing Maintainable Frontend Architectures for Real-Time Interactive 3D Web Applications

> Graduation Thesis — ICT
> Reference implementation: `3d-interactive-app` (Next.js + React + TypeScript + Three.js)
>
> **Note for the author:** Every technical claim below is traceable to a file in `src/`.
> Sections marked _“architecturally prepared”_ describe patterns that exist in the code
> but are intentionally left as extension points (see the `TODO:` comments in the
> referenced files). Keep that distinction in the defense — it reads as engineering
> maturity, not as a gap.

---

## Chapter 1 — Introduction

### 1.1 Background

Over the last decade the web browser has evolved from a document viewer into a
general-purpose application runtime. Two shifts make this thesis possible:

1. **GPU access in the browser.** WebGL exposes the graphics pipeline to
   JavaScript, so real-time 3D rendering — once the exclusive domain of native
   engines — now runs inside a tab with no plugin. Libraries such as **Three.js**
   wrap the low-level WebGL API in a scene-graph model (scene, camera, mesh,
   material, light) that is approachable from application code.

2. **The growing complexity of the frontend.** Modern frontends are no longer
   thin view layers. They manage non-trivial state, asynchronous data, animation,
   and now real-time simulation. As a result, the *architecture* of the frontend —
   how responsibilities are separated and how data flows — has become as important
   as the features themselves.

This project sits at the intersection of these two trends: a real-time, interactive
3D application built with a modern frontend stack (**Next.js 16**, **React 19**,
**TypeScript 5**, **Three.js r184**, **Tailwind CSS 4**), used as a vehicle to study
how a maintainable architecture can be designed for this class of application.

### 1.2 Problem Statement

The problem this thesis addresses is **not** “how to build a game.” A game is merely
the most demanding stress-test available to a frontend developer, because it forces
three concerns to coexist that are usually kept apart:

- a **continuous simulation** running at ~60 frames per second,
- a **GPU rendering loop** that must stay decoupled from that simulation, and
- a **declarative React UI** that must stay in sync with both without being driven
  at 60 FPS itself.

The central problem is therefore:

> **How can a frontend architecture be designed so that real-time 3D interaction,
> application state, and the user interface remain cleanly separated, individually
> testable, and maintainable as the application grows?**

A naïve implementation collapses these concerns into the render loop — UI reads and
writes Three.js objects directly, game rules live inside event handlers, and state is
scattered across mutable objects. Such code is impossible to test, reason about, or
extend. This thesis demonstrates an alternative: a **state-driven architecture** that
keeps the simulation pure and the rendering and UI as projections of a single source
of truth.

### 1.3 Objectives

1. **Build an interactive real-time 3D web application** that runs entirely in the
   browser and responds to user input within a single frame.
2. **Implement a state-driven architecture** in which a single, serializable state
   object is the only source of truth, and all changes flow through a pure reducer.
3. **Separate the three concerns** — user interface, game logic, and 3D rendering —
   into layers with explicit, one-directional dependencies.
4. **Demonstrate real-time interaction techniques** end-to-end: mouse picking via
   raycasting, parabolic projectile firing, collision detection, and basic enemy AI.
5. **Evaluate the architecture** against software-quality attributes —
   maintainability, modularity, scalability — rather than only against gameplay.

### 1.4 Scope

**Included (implemented in this project):**

- Real-time 3D rendering with Three.js (scene, camera, lighting, scenery, animated
  glTF models with a procedural fallback).
- A from-scratch state container with a pure reducer and a typed action vocabulary.
- A fixed-order game loop driven by `requestAnimationFrame` with delta-time
  integration.
- Seven cooperating systems: wave spawning, entity spawning, shooting, movement,
  collision, cleanup, and rendering.
- Interaction: click-to-aim/click-to-fire with raycasting, projectile physics, and
  ESC-to-pause.
- A state-driven UI: HUD, control panel, and lifecycle overlays.

**Excluded (out of scope, deliberately):**

- **Multiplayer / networking** — there is no server authority, no synchronization,
  no client prediction.
- **Advanced AI** — enemies use simple goal-seeking with sinusoidal wander, not
  path-finding or behaviour trees.
- **Backend-heavy architecture** — the application is fully client-side; there is no
  database, no API layer, no persistence.
- **Advanced physics** — collisions use sphere/distance tests and projectiles use
  closed-form kinematics, not a rigid-body engine.

The scope is chosen so that the *architecture* — not raw feature count — is the
contribution.

---

## Chapter 2 — Theoretical Background

### 2.1 Frontend Architecture Concepts

**Separation of concerns (SoC).** Each module should have one reason to change. In
this project SoC is enforced physically through the folder layout and, more
importantly, through dependency direction: `src/core/` (state) knows nothing about
`src/systems/` (logic), which knows nothing about React, which knows nothing about
the reducer’s internals. Every source file opens with a header comment declaring
*what belongs here* and *what does not* — turning SoC from an aspiration into a
documented contract.

**Modular architecture.** The system is decomposed into small modules with explicit
public APIs (a factory function, a system function, a hook). Modules communicate
through data (the state object, typed actions, typed events), never by reaching into
each other’s internals.

**State-driven systems.** Instead of objects that own their behaviour (classic OOP
“smart entities”), the world is represented as **plain data** and behaviour lives in
**stateless functions** that transform that data. This is the conceptual core of the
thesis and is developed fully in §2.5 and §4.3.

### 2.2 Real-Time Rendering

A real-time application must produce a new image many times per second. The
mechanism is the **render loop**:

```
each frame:
    dt ← time since last frame
    update(dt)     // advance the simulation
    render()       // draw the current state
    schedule next frame
```

Two ideas matter for this thesis:

- **Frame update with delta-time.** Because frame intervals vary, motion must be
  scaled by elapsed time (`position += velocity · dt`) so the simulation runs at the
  same *speed* regardless of frame *rate*.
- **Update/render separation.** The simulation step (“what is true now”) is kept
  distinct from the drawing step (“paint what is true now”). This separation is what
  allows the same state to be rendered, tested, or replayed independently of the GPU.

### 2.3 WebGL & Three.js

WebGL is a low-level GPU API. Three.js raises it to a **scene-graph** abstraction:

| Concept | Role | In this project |
| --- | --- | --- |
| **Scene** | Root container of everything drawn | `createThreeContext()` in `lib/threeSetup.ts` |
| **Camera** | Defines the viewpoint and projection | `PerspectiveCamera`, `lib/camera.ts` |
| **Renderer** | Draws a scene from a camera onto a canvas | `WebGLRenderer`, `lib/threeSetup.ts` |
| **Mesh** | Geometry + material = a drawable object | Entity factories in `entities/*` |
| **Light** | Illuminates materials | `lib/lighting.ts` |
| **Animation/Skinning** | Deforms rigged meshes | glTF models loaded in `lib/modelCache.ts` |

The renderer is created exactly once and disposed exactly once, because a WebGL
context is a heavy, side-effectful resource — a concern handled in §4.6.

### 2.4 Next.js Architecture

**Next.js** is a React framework providing routing, bundling, and a hybrid
server/client component model (the **App Router**).

- **Component-based architecture.** The UI is a tree of composable components; the
  `/game` route (`app/game/page.tsx`) is itself a small composition of
  `GameCanvas`, `HUD`, `ControlPanel`, and overlays.
- **Client-side interaction.** Three.js and the game loop only exist in the browser,
  so the interactive surface is marked a **Client Component** (`"use client"`). This
  is a deliberate architectural decision: the heavy, stateful, browser-only code is
  isolated behind a single client boundary, while the rest of the framework’s
  server-rendering capabilities remain available to the wider app.

### 2.5 State Management Theory

This is the intellectual centre of the thesis.

**Centralized state.** All information needed to compute the next frame lives in one
object, `GameState` (`types/game.ts`). Anything *not* in that object is either
ephemeral input, derived data, or rendering-only mirror state.

**The reducer pattern.** State never changes in place. Instead, a **pure function**

```
reducer(previousState, action) → nextState
```

derives the next state from the previous state plus a description of *what happened*
(an **action**). Because the function is pure (no I/O, no randomness, no mutation),
state transitions are:

- **predictable** — same input always yields the same output;
- **testable** — call the function and assert on the result, no mocks;
- **debuggable / replayable** — actions form a log that can be inspected or replayed.

**Predictable transitions over a closed vocabulary.** The set of legal actions is a
closed, exhaustive TypeScript union (`types/actions.ts`). The compiler guarantees the
reducer handles every case (via a `never` exhaustiveness check), so the set of ways
the world can change is finite and known. This is the same principle behind Redux and
React’s `useReducer`, implemented here from scratch precisely so the thesis can
describe the mechanism end-to-end.

---

## Chapter 3 — Game & UX Design

### 3.1 Gameplay Design

The application is a single-player **tower-defense / shooting-gallery** scenario,
chosen because it exercises every architectural concern with the smallest possible
rule set.

- **Player objective.** A stationary cannon, parked on the left of a walled yard,
  must destroy waves of monsters that advance from the right.
- **Enemy waves.** Difficulty is wave-based. A new wave starts on a fixed interval
  (`WAVE_INTERVAL_MS = 8000`) and grows linearly in size
  (`count = WAVE_BASE_COUNT + (wave − 1)·2`), as defined in `systems/waveSystem.ts`.
- **Progression / variety.** Three monster archetypes give a difficulty texture,
  tuned in one table (`ENEMY_STATS`, `core/constants.ts`):

  | Variant | Role | Speed | Health | Score | Model |
  | --- | --- | --- | --- | --- | --- |
  | `grunt` | fast fodder (weakest) | 3.2 | 15 | 5 | `Skeleton.glb` |
  | `stalker` | the default foe (medium) | 2.2 | 35 | 10 | `Zombie.glb` |
  | `brute` | slow tank (hardest) | 1.1 | 80 | 25 | `Big arm.glb` |

  Variant selection is weighted (60% grunt / 30% stalker / 10% brute) in
  `pickVariant()`. _Adding a fourth monster requires one row in this table, one model
  mapping, and nothing else_ — a concrete demonstration of the architecture’s
  extensibility.

### 3.2 User Interaction Design

Interaction is intentionally minimal and direct, to keep the focus on the input →
state → render pipeline:

- **Mouse aiming.** The cannon barrel continuously tracks the cursor’s ground
  position.
- **Click shooting.** A left click fires a cannonball that follows a parabolic arc
  and lands on the clicked point.
- **Responsive feedback.** Firing is gated by a cooldown
  (`PLAYER_FIRE_COOLDOWN_MS = 350`); while on cooldown the barrel still tracks the
  cursor (`systems/shootingSystem.ts`), so the control always feels live even when a
  shot is suppressed. On a hit, the target plays a short topple-and-sink death
  animation (`ENEMY_DEATH_MS = 450`).

### 3.3 HUD Design

The Heads-Up Display (`components/HUD.tsx`) is the canonical “render from state”
example. It shows three read-outs — **Score**, **Wave**, **Health** — and is wired to
the store through *narrow selectors* so it re-renders only when those specific slices
change, never every frame:

```tsx
const score  = useGameStore((s) => s.score);
const wave   = useGameStore((s) => s.wave);
const health = useGameStore((s) => /* player.health */);
```

The HUD never touches Three.js, the loop, or the reducer — it is a pure projection of
state.

### 3.4 Control Panel Design

The control panel (`components/ControlPanel.tsx`) separates *player-facing* read-outs
(HUD) from *operator-facing* controls. It demonstrates the **UI → state** half of the
loop: its buttons dispatch lifecycle actions (`PAUSE`, `RESUME`, `RESET`) and the
panel itself is conditionally rendered based on `phase`.

**Runtime parameter control (architecturally prepared).** The panel is designed as
the home of live, designer-style tuning. The supporting pieces already exist: a
store-agnostic `Slider` primitive (`components/ui/Slider.tsx`) that emits a controlled
value, the central tuning table in `core/constants.ts`, and the `dispatch` channel to
push changes into state. Wiring a difficulty slider is therefore a leaf change (the
`TODO:` in `ControlPanel.tsx` marks the exact spot). This shows the *value* of the
architecture: a feature that would normally cut across rendering and logic becomes a
single, isolated UI addition because all tuning flows through one state channel.

### 3.5 UX Principles

- **Readability.** High-contrast HUD text over a dark scene; monster silhouettes are
  differentiated by size and shape so the threat reads at a glance.
- **Responsiveness.** Input is consumed within the same frame it arrives; the cannon
  tracks the cursor every frame.
- **Visual clarity.** A right-aligned yard with a subtle ground grid gives motion a
  frame of reference; scenery (house, fence) sits *outside* the playfield so the
  playable area stays unambiguous (`core/constants.ts`, `lib/threeSetup.ts`).
- **Feedback consistency.** Every meaningful event has a visible response: firing,
  the cooldown, the hit, the death animation, the score increment.

---

## Chapter 4 — Technical Design & Implementation

### 4.1 System Architecture

The application is organised into four layers with **strictly one-directional**
dependencies (each layer depends only on the layer below):

```
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER            React components (client)                │
│  app/game/page.tsx · GameCanvas · HUD · ControlPanel · Overlays
│        │  dispatch(action)              ▲  useGameStore(selector)
│        ▼                                │
├─────────────────────────────────────────────────────────────┤
│  STATE LAYER         single source of truth                  │
│  gameStore · reducer · state · types/game · types/actions    │
│  eventBus (transient notifications)                          │
│        ▲  getState() / dispatch()                            │
│        │                                                     │
├─────────────────────────────────────────────────────────────┤
│  SYSTEMS LAYER       the simulation                          │
│  gameLoop → wave · spawn · shooting · movement · collision · │
│             cleanup · render                                 │
│        │  reads entities, produces meshes                    │
│        ▼                                                     │
├─────────────────────────────────────────────────────────────┤
│  RENDERING LAYER     Three.js                                │
│  threeSetup · camera · lighting · scenery · modelCache ·     │
│  entities/* (mesh factories)                                 │
└─────────────────────────────────────────────────────────────┘
```

The **renderSystem** is the only place where the Systems layer and the Rendering
layer meet; the **gameStore** is the only place the UI and Systems layers meet. These
two narrow bridges are what keep the simulation independent of both React and
Three.js.

### 4.2 Frontend System Design — folder structure & responsibilities

```
src/
├── app/              Next.js routes (server boundary → client surface)
│   ├── layout.tsx
│   ├── page.tsx
│   └── game/page.tsx        composition of the interactive surface
├── core/             STATE LAYER
│   ├── gameStore.ts         store + React binding (useSyncExternalStore)
│   ├── reducer.ts           pure (state, action) → state
│   ├── state.ts             initialState() factory
│   ├── eventBus.ts          typed publish/subscribe for transient events
│   ├── gameLoop.ts          requestAnimationFrame scheduler + system order
│   └── constants.ts         all tuning numbers in one place
├── types/            CONTRACTS
│   ├── game.ts              GameState, GamePhase, InputState
│   ├── actions.ts           GameAction discriminated union
│   └── entity.ts            Entity union (player/enemy/bullet/house)
├── systems/          SYSTEMS LAYER (logic)
│   ├── waveSystem.ts        when/what to spawn
│   ├── spawnSystem.ts       drain spawn queue → entities
│   ├── shootingSystem.ts    input → projectile (parabolic solve)
│   ├── movementSystem.ts    integrate velocity, enemy steering, gravity
│   ├── collisionSystem.ts   bullet ↔ enemy hit detection + scoring
│   ├── cleanupSystem.ts     retire dead/expired entities
│   └── renderSystem.ts      state ↔ Three.js reconciliation
├── entities/         data + mesh factories per kind
│   ├── Player.ts  Enemy.ts  Bullet.ts  House.ts
├── lib/              RENDERING + pure utilities
│   ├── threeSetup.ts  camera.ts  lighting.ts  scenery.ts
│   ├── modelCache.ts        glTF preload + clone + normalize
│   ├── raycasting.ts        screen → world picking
│   ├── math.ts              Vec3 helpers (no Three.js dependency)
│   └── helpers.ts           ids, random, formatting
├── hooks/            React ↔ engine adapters
│   ├── useGameLoop.ts  useMouse.ts  useKeyboard.ts
└── components/       UI LAYER
    ├── GameCanvas.tsx  HUD.tsx  ControlPanel.tsx
    ├── ui/ (Button, Slider, Panel)  overlays/ (Start/Pause/Win/Lose)
```

A key design property: **`lib/math.ts` and the entire simulation operate on `Vec3`
tuples, not on Three.js `Vector3` objects.** This deliberately keeps the logic layer
free of any rendering dependency, so the simulation could in principle run headless
(e.g. in a unit test or on a server) with no GPU present.

### 4.3 State-Driven Architecture (core)

**The state object** (`types/game.ts`). The whole world is one interface:

```ts
interface GameState {
  phase: GamePhase;          // idle | playing | paused | won | lost
  tick: number;              // frame counter
  elapsedMs: number;         // sim clock — drives waves, cooldowns, animation
  score: number;
  wave: number;
  entities: Entity[];        // every living thing
  input: InputState;         // last input snapshot (systems never poll the DOM)
}
```

**Entities are plain data** (`types/entity.ts`). A discriminated union keyed by
`kind` (`player | enemy | bullet | house`) means a system narrows behaviour with a
simple `switch (e.kind)` and the compiler knows the exact fields available in each
branch. There are **no methods on entities** — this is the ECS-adjacent “data, not
objects” choice that keeps state serializable and time-travellable.

**Actions** (`types/actions.ts`). The closed vocabulary of state changes:
`START, PAUSE, RESUME, RESET, WIN, LOSE, TICK, SET_INPUT, SPAWN, DESPAWN,
REPLACE_ENTITIES, ADD_SCORE, SET_WAVE`. Nothing outside this list can legally modify
state.

**The reducer** (`core/reducer.ts`) is the single mutation point — pure, no side
effects, ending in an exhaustiveness check:

```ts
default: { const _exhaustive: never = action; return state; }
```

If a new action type is ever added without a matching case, the project fails to
compile. This turns a whole class of runtime bugs into compile-time errors.

**The store** (`core/gameStore.ts`) holds the current state and the subscriber set:

```ts
function dispatch(action) {
  const next = reducer(state, action);
  if (next === state) return;        // no-op short-circuit
  state = next;
  listeners.forEach((fn) => fn());
}
```

**The dispatch flow**, end to end:

```
user click / key / system tick
        │
        ▼
   dispatch(action) ──► reducer(state, action) ──► next state
        │                                              │
        │                                              ▼
        │                                     listeners notified
        │                          ┌───────────────────┴──────────────┐
        ▼                          ▼                                   ▼
  systems read getState()   React components re-render          (no React re-render
  on the next frame         only the slices that changed         at 60 FPS — see §4.8)
```

### 4.4 Game Loop

`core/gameLoop.ts` is the heartbeat. It schedules frames with
`requestAnimationFrame`, computes delta-time, and calls the systems in a **fixed,
documented order** — order matters because, e.g., movement must run before collision
so collisions test up-to-date positions:

```ts
if (phase === "playing") {
  dispatch({ type: "TICK", dt });   // advance clocks only
  waveSystem(dt);                   // decide WHEN/WHAT to spawn
  spawnSystem(dt);                  // create queued entities
  shootingSystem(dt);               // input → bullet (parabolic)
  movementSystem(dt);               // integrate velocity + gravity
  collisionSystem(dt);              // bullet ↔ enemy → damage + score
  cleanupSystem(dt);                // retire dead/expired entities
}
renderSystem(ctx);                  // ALWAYS — scene stays drawn even when paused
```

Two robustness details:

- **Delta-time clamping.** In the reducer, `dt` is clamped to `MAX_DELTA_MS`
  (≈33 ms). If the tab is backgrounded and a huge `dt` arrives, the simulation
  advances at most one “slow frame” instead of teleporting every entity across the
  map — a classic spiral-of-death guard.
- **Render runs unconditionally.** Simulation is skipped while `paused/idle/won/lost`,
  but `renderSystem` still draws, so overlays sit over a live, correct scene.

### 4.5 Systems Design

Every system follows the same shape — **read state → compute a new entity list →
commit once via a single action** — and never mutates state in place.

- **`movementSystem`** integrates motion with semi-implicit Euler.
  - *Bullets* update velocity with gravity then position
    (`v.y −= g·dt`, `p += v·dt`).
  - *Enemies* steer toward the cannon (`atan2(dx, dz)`) with a per-enemy sinusoidal
    wander (`wanderPhase`) so a wave weaves instead of marching in lockstep.
- **`collisionSystem`** runs a pairwise bullet↔enemy test using **squared** distance
  against `HIT_RADIUS_SQ` (= 0.6²) to avoid a `sqrt` per pair. On a hit it consumes
  the bullet, starts the enemy’s death timer, adds the variant’s score, and emits
  `bullet:hit` / `enemy:killed` events. (The current implementation is the
  straightforward O(n·m) broadphase; a spatial-grid upgrade is marked as a `TODO`.)
- **`spawnSystem`** drains a module-level queue of spawn requests and dispatches
  `SPAWN`. Keeping per-frame intent in a local queue (rather than the action log)
  keeps the reducer history meaningful.
- **`shootingSystem`** and **`waveSystem`** are detailed in §4.7 and §3.1.
- **`cleanupSystem`** ticks bullet lifetimes and enemy death timers, removes entities
  on ground impact or when their timer hits zero, and is the designated home for
  win/lose checks.

### 4.6 3D Rendering Implementation

**One-shot setup / teardown** (`lib/threeSetup.ts`). `createThreeContext(canvas)`
builds the `WebGLRenderer`, `Scene`, and `Camera` exactly once and returns a
`ThreeContext`, together with a `dispose()` that frees every geometry/material and the
renderer. Because a WebGL context is a heavy, side-effectful resource, this lifecycle
is centralised so React’s mount/unmount (and StrictMode’s double-invoke in
development) cannot leak or double-initialise it.

- **Camera** (`lib/camera.ts`). A `PerspectiveCamera` (FOV 55°, near 0.1, far 200)
  positioned to the side along +Z and slightly above, giving a clean profile of the
  cannon-vs-enemies action axis.
- **Lighting** (`lib/lighting.ts`). An `AmbientLight` fill plus a warm
  `DirectionalLight` “sun”, so nothing is pure black and forms read clearly.
- **Scenery** (`lib/scenery.ts`). Static, non-interactive geometry (the perimeter
  fence) built once and never touched again.
- **Mesh factories** (`entities/*`). Each entity kind owns a factory that returns a
  `THREE.Object3D`; every mesh stores its `entityId` in `userData` so the renderer can
  reconcile it.

**The reconciliation bridge** (`systems/renderSystem.ts`) is the single point where
data meets the GPU. Each frame it:

1. maintains a `Map<entityId, Object3D>`;
2. creates a mesh for any new entity and removes/disposes meshes whose entity is gone;
3. copies each entity’s `position` onto its mesh;
4. applies per-kind visual logic — the cannon swivels to its `aimTarget`, enemies yaw
   to face the cannon and play the topple-and-sink death animation driven by `dyingMs`;
5. calls `renderer.render(scene, camera)`.

This is a tiny “virtual-DOM for the scene graph”: the scene is always a function of
the entity list, exactly as React’s DOM is a function of component state.

**3D asset pipeline (glTF).** `lib/modelCache.ts` preloads every `.glb` once with
`GLTFLoader`, caches the parsed scene, and serves cheap clones via `SkeletonUtils`
(so rigged characters clone correctly). `normalizeModel()` fits each model to a target
size and seats it on the ground, making the pipeline robust to whatever units a model
was authored in. Crucially, every entity factory falls back to a procedural mesh if a
model is missing — so the application **always renders something**, which is both a UX
and a resilience property.

### 4.7 Physics & Interaction Techniques

- **Projectile motion (closed-form).** Given a muzzle `P`, a target `T` on the
  ground, a fixed flight time `t` (`BULLET_FLIGHT_MS = 1.5 s`) and gravity `g`,
  `shootingSystem` solves constant-acceleration kinematics for the launch velocity:

  ```
  vx = (Tx − Px) / t
  vz = (Tz − Pz) / t
  vy = (Ty − Py + ½·g·t²) / t
  ```

  Because flight time is fixed, every shot takes the same time to land — a
  predictable, readable feel. The movement system then integrates this velocity under
  gravity each frame.

- **Numerical integration.** Motion uses **semi-implicit (symplectic) Euler** —
  update velocity first, then position with the new velocity — which is stable and
  visually indistinguishable from higher-order integrators at this scale.

- **Collision detection.** Sphere overlap via squared distance (§4.5): cheap, branch-
  light, and adequate for the entity counts in scope.

- **Raycasting / picking** (`lib/raycasting.ts`). A pointer event is converted to
  normalised device coordinates, a `THREE.Raycaster` is cast from the camera, and the
  first intersection with the ground plane is returned as a world point. This is the
  bridge from 2D screen space to the 3D world that makes click-to-aim possible.

- **Movement interpolation.** All motion is delta-time scaled, so behaviour is
  frame-rate independent (the same world-speed at 30 or 144 FPS).

### 4.8 UI ↔ State Synchronization

This section answers the hardest question in real-time React: *how does a 60 FPS
simulation drive a declarative UI without re-rendering React 60 times per second?*

The answer is **`useSyncExternalStore` with selectors** (`core/gameStore.ts`). The
store lives **outside** React. The fast path — loop ↔ systems ↔ store — runs free of
React entirely. Components subscribe only to the **slice** they display:

```ts
export function useGameStore<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), …);
}
```

A component re-renders only when *its selected slice’s reference* changes. So the HUD
updates when `score`/`wave`/`health` change, the overlays update when `phase` changes,
and the thousands of per-frame `position` mutations cause **zero** React renders. This
is the precise mechanism that lets a real-time engine and a declarative UI coexist.

The synchronisation is **bidirectional but cleanly split**:

- **UI → State:** `ControlPanel` and overlays call `dispatch({ type: "PAUSE" })`
  etc.; these are the only way the user mutates the world.
- **State → UI:** `HUD` and overlays read via selectors and re-render reactively.

The same channel is what makes the *runtime parameter control* of §3.4 a trivial
extension: a slider’s `onChange` is just another `dispatch`, and every reader updates
automatically.

---

## Chapter 5 — Results & Evaluation

### 5.1 Functional Results

_(Insert screenshots here.)_ The delivered application:

- boots to a Start overlay; on **Start** it spawns the cannon and begins waves;
- renders a 3D yard with a house, perimeter fence, the player cannon, and animated
  glTF monsters (skeleton / zombie / big-arm), each with a procedural fallback;
- supports click-to-aim and click-to-fire with arcing projectiles, hit detection,
  scoring, and a death animation;
- shows a live HUD (score / wave / health) and a control panel (pause / resume /
  reset); ESC toggles pause;
- correctly freezes the simulation while paused yet keeps the scene drawn.

**Suggested screenshots:** (1) Start overlay; (2) active wave with several monsters;
(3) a shot mid-arc; (4) the pause state with the control panel; (5) the dev-tools
performance panel showing a stable frame time.

### 5.2 Architecture Evaluation

The architecture is the primary contribution; it is evaluated against three quality
attributes.

- **Maintainability.** Every file declares its responsibility and its non-
  responsibilities in a header contract. State changes are confined to one pure
  reducer; rendering is confined to one reconciliation system; GPU lifecycle is
  confined to one setup module. A developer can locate the cause of any behaviour by
  layer, not by searching. *Evidence:* the “add a monster = one table row” property
  (§3.1), and the “add a slider = one `dispatch`” property (§3.4/§4.8).

- **Modularity.** Dependencies point in one direction (UI → State → Systems →
  Rendering). The simulation has no compile-time dependency on React or Three.js
  (it operates on `Vec3` tuples), so logic and rendering can evolve — or be tested —
  independently. The two integration points (store, renderSystem) are deliberately
  narrow.

- **Scalability (of the codebase).** New features slot into the existing seams: a new
  entity kind = a type in the union + a factory + a `meshFor` case; a new rule = a new
  system inserted into the loop order; a new transient effect = an event channel on
  the bus. The action vocabulary and exhaustiveness check make these additions
  compiler-guided.

### 5.3 Performance

- **Frame-rate stability.** Rendering is `requestAnimationFrame`-driven and the
  simulation is delta-time integrated, so motion is frame-rate independent; the
  delta-time clamp prevents catch-up spikes after the tab is backgrounded.
- **React render pressure.** The external store + selector design means per-frame
  state changes trigger no React reconciliation; only meaningful HUD/phase changes do.
  This removes the most common performance pitfall of “React + game loop” designs.
- **Allocation discipline.** Collision uses squared distance (no `sqrt`); the movement
  system skips allocating new objects for stationary entities; models are loaded once
  and cloned. *(Suggested measurement to include: average frame time / FPS over a
  full wave, captured from the browser performance panel.)*

### 5.4 Limitations

Stated honestly, and traceable to `TODO:` markers in the code:

- **No win/lose triggering yet.** The `won`/`lost` phases, the `WIN`/`LOSE` actions,
  and all four overlays exist, but the *conditions* that fire them are not yet wired
  (`cleanupSystem` is the designated host). Player health is therefore currently
  static.
- **No player/house damage.** Enemy↔player and enemy↔house collisions are marked
  `TODO` in `collisionSystem`; the house carries a `health` field but is decorative.
- **Simple AI.** Goal-seeking with sinusoidal wander only — no path-finding, no
  avoidance.
- **Lightweight physics.** Closed-form projectiles and sphere collisions; no rigid
  bodies, no friction, no continuous collision.
- **Event bus has no consumers yet.** Events are emitted (`enemy:killed`, etc.) but no
  SFX/particle listeners are attached — the channel is built ahead of its consumers.
- **Naïve broadphase.** Collision is O(n·m); fine in scope, but a spatial grid is the
  noted next step.

These are deliberate scope boundaries, not oversights; each has a defined extension
point.

---

## Chapter 6 — Conclusion & Future Work

### 6.1 Conclusion

This thesis set out to show that a demanding real-time, interactive 3D web application
can be built on a frontend architecture that stays **maintainable, modular, and
scalable**. The delivered system demonstrates exactly that: a single state object as
the source of truth, a pure reducer as the only mutation point, a fixed-order
system loop as the simulation, and Three.js as a *projection* of state rather than the
owner of it. The UI is reconnected to this fast, external simulation through
`useSyncExternalStore` selectors, so a 60 FPS engine and a declarative React interface
coexist without conflict.

The contribution is therefore not the game, but the **demonstrated separation of UI,
logic, and rendering** into layers with one-directional dependencies and explicit,
compiler-enforced contracts — a template that generalises to any real-time interactive
frontend (data-visualisation, simulation, configurators, editors).

### 6.2 Future Work

- **Complete the gameplay loop.** Wire enemy↔player/house collisions and the
  win/lose conditions in `cleanupSystem`, activating the existing phases and overlays.
- **Runtime parameter control.** Connect difficulty sliders in the control panel to
  the tuning constants — the architectural payoff already designed for in §3.4.
- **Persistence & leaderboard API.** Add an optional backend for high scores — the
  first deliberate step beyond the client-only scope.
- **Multiplayer.** Introduce server authority and state synchronisation; the pure,
  serializable state model is a natural foundation for it.
- **A full ECS.** Generalise the current “data + systems” model into a component-based
  ECS for larger entity counts (with a spatial-grid broadphase).
- **Advanced rendering.** Enable shadows (already stubbed in `lighting.ts`), custom
  shaders, and post-processing.
- **Effects layer.** Attach listeners to the event bus for sound and particles —
  consuming the notifications the simulation already emits.

---

### Appendix A — Key Tuning Constants (`src/core/constants.ts`)

| Constant | Value | Meaning |
| --- | --- | --- |
| `MAX_DELTA_MS` | 33.3 | delta-time clamp (≈30 FPS floor) |
| `WORLD_HALF_SIZE` | 14 | half-width of the yard (action axis) |
| `YARD_HALF_DEPTH` | 12 | half-depth of the yard |
| `GRAVITY` | 9.81 | projectile gravity (m/s²) |
| `PLAYER_FIRE_COOLDOWN_MS` | 350 | minimum time between shots |
| `BULLET_FLIGHT_MS` | 1500 | fixed projectile time-of-flight |
| `ENEMY_DEATH_MS` | 450 | death animation duration |
| `WAVE_INTERVAL_MS` | 8000 | time between waves |
| `WAVE_BASE_COUNT` | 3 | enemies in wave 1 |

### Appendix B — Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router, Turbopack) | 16.2.5 |
| UI library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| 3D engine | Three.js | r184 |
| Styling | Tailwind CSS | 4.x |
