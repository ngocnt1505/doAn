::: titlepage
UNIVERSITY OF SCIENCE AND TECHNOLOGY OF HANOI

**Software Requirements Specification**

3D House Defense Game Implemented with WebGL and Three.js

  ---------------- ------------------
  Student:         Nguyen Thuy Ngoc
  Student ID:      23BI14344
  Academic Year:   2025--2026
  ---------------- ------------------

2026-06-17
:::

# Introduction

## Purpose

The purpose of this Software Requirements Specification (SRS) is to
define the functional and non-functional requirements of the *3D House
Defense Game Implemented with WebGL and Three.js*. This document serves
as a reference for the analysis, design, implementation, testing, and
evaluation of the system throughout the project lifecycle.

Although the application is presented as a simple 3D defense game, its
primary objective is to demonstrate the development of a modern
interactive web application using frontend technologies. The system is
developed with Next.js, React, TypeScript, and Three.js, providing an
opportunity to explore component-based architecture, type-safe
development practices, real-time rendering, and interactive user
experiences within a browser environment.

## Scope

The project consists of a browser-based interactive 3D application
developed using modern web technologies. The application is implemented
using Next.js as the frontend framework and TypeScript as the primary
programming language. Three.js and WebGL are used to construct and
render the interactive 3D environment directly within the browser. The
application presents a defensive gameplay scenario in which the player
protects a house from approaching monsters by aiming and firing
projectiles.

The game environment includes a house, surrounding yard, fence,
monsters, and weapons rendered within a three-dimensional scene. Players
interact with the application through mouse-based controls to observe
the environment, target enemies, and perform shooting actions.

While the game scenario provides the functional context of the
application, the primary focus of the project is the implementation of
frontend systems that support real-time interaction and rendering. The
project demonstrates how modern web technologies can be used to build
responsive and visually rich browser applications without requiring
dedicated game engines or native software installation.

## Objectives

The main objectives of this project are as follows:

- Develop a browser-based interactive 3D application using modern
  frontend development practices like Next.js, React, and TypeScript.

- Demonstrate the integration of real-time rendering and user
  interaction within a web environment.

- Apply fundamental computer graphics concepts such as scene
  construction, lighting, texture mapping, animation, and object
  interaction.

- Design and implement gameplay mechanics that provide meaningful
  interaction with the virtual environment.

- Explore frontend architectural approaches for managing application
  state and real-time events.

- Deliver a complete and functional software product that can be
  executed directly within modern web browsers.

## Document Structure

This document is organized into five sections.

Section 1 introduces the purpose, scope, objectives, and terminology
used throughout the document.

Section 2 provides an overview of the system, including its background,
users, constraints, and major functionalities.

Section 3 specifies the detailed functional requirements of the
application.

Section 4 describes the non-functional requirements that define the
quality attributes of the system.

Section 5 presents potential future enhancements that may be implemented
if additional development time is available.

# Overall Description

## Project Background

Recent advances in browser technologies have significantly expanded the
capabilities of frontend web applications. Modern frameworks and
graphics libraries enable developers to build highly interactive
experiences that extend beyond traditional user interfaces and static
web pages.

Modern technologies allow developers to create real-time 3D environments
directly within web browsers, making it possible to deliver immersive
visual experiences without requiring native software installation. As a
result, frontend development increasingly involves not only interface
construction but also rendering systems, animation pipelines, user
interaction processing, and performance optimization.

This project explores the intersection between frontend engineering and
computer graphics by developing an interactive 3D application that
combines these technologies within a practical use case.

## Problem Statement

Traditional frontend projects often focus on forms, dashboards, and
data-driven interfaces. While these applications demonstrate common web
development skills, they provide limited opportunities to explore
advanced interaction models and real-time rendering techniques.

The challenge addressed by this project is to design and implement a
browser-based application that demonstrates how modern frontend
technologies can support complex interactive experiences. The system
must process user input in real time, manage dynamic objects within a
three-dimensional environment, provide responsive visual feedback, and
maintain acceptable rendering performance throughout gameplay.

## Game Story

The player begins by accessing the web application and is presented with
a Welcome Screen. This screen provides a brief introduction to the game
and its objective, along with a button that allows the player to start a
new game session.

After selecting the Start Game button, the player enters the gameplay
scene. The game environment, wave information, gameplay timer, and
control panel are displayed. Before gameplay begins, a countdown
sequence consisting of "3", "2", "1", and "Ready" is shown on the
screen. Three seconds after the Ready message disappears, the first
enemy is spawned.

The player's objective is to defend a house located at the center of the
battlefield. Enemies continuously advance toward the house using
non-linear movement patterns with random directional variations. To
encourage distributed enemy movement and prevent clustering, the front
side of the house spans the entire width of the battlefield.

The game features three enemy types with different health and movement
characteristics. Easy enemies have 100 health points and move at the
highest speed, reaching the house in approximately twenty seconds if not
eliminated. Medium enemies have 200 health points and require
approximately twenty-five seconds to reach the house. Hard enemies have 400
health points and move at the slowest speed, requiring approximately
thirty seconds to reach the house.

To defend the house, the player controls a cannon that fires projectiles
toward selected locations on the battlefield. When the player clicks on
the ground, a visual marker represented by an "X" appears at the
selected location. The cannon immediately fires a projectile toward that
position. Projectiles travel using a ballistic trajectory and land after
a weapon-dependent travel time.

Three weapon levels are available throughout the game. The player starts
with the Basic Weapon, which deals 30 damage per normal shot and
generates a stronger Big Shot after every three attacks. More powerful
weapons are unlocked through wave progression, providing increased
damage output, faster projectile travel times, and enhanced special
attacks.

Damage is calculated when a projectile reaches its landing position.
Enemies located closer to the impact point receive more damage, while
enemies farther away receive less damage. An enemy positioned exactly at
the impact location receives the full damage value of the projectile.

The game is divided into three progressively more difficult waves. Each
wave introduces a predefined combination of enemy types. After all
enemies in the current wave have been defeated, a transition message
displaying the upcoming wave number appears for three seconds before the
next wave begins.

The player loses immediately if any enemy successfully crosses the
defensive boundary and reaches the protected area. When this occurs, a
defeat overlay is displayed along with an option to restart the game.

The player wins by successfully completing all three waves and
eliminating every enemy. Upon victory, a congratulatory overlay is
displayed together with an option to return to the Welcome Screen and
start a new session.

## Target Users

The primary users of the system include students, educators, and
individuals interested in web development, computer graphics, and
interactive application design.

The application is designed for users who have access to a modern
desktop web browser and are capable of interacting with mouse-based
controls.

## System Overview

The system is a browser-based interactive 3D application in which the
player must defend a house against incoming monsters.

When the application starts, the player is presented with a complete 3D
environment containing a house, yard, fence, monsters, and available
weapons. During gameplay, monsters move toward the protected area while
the player uses mouse controls to aim and shoot projectiles.

The game is organized into three consecutive waves of increasing
difficulty. The player begins with a basic weapon and unlocks additional
weapons after completing each wave. Victory is achieved by eliminating
all monsters in the final wave, while defeat occurs if any monster
reaches the house.

From a technical perspective, the application integrates multiple
frontend subsystems including scene rendering, input handling, animation
control, object management, collision processing, state management, and
visual feedback generation.

## System Context

The application operates entirely within a web browser and does not
require external services for its core functionality.

User interactions are processed locally and rendered in real time
through WebGL using the Three.js framework. All game logic, rendering
operations, animation updates, and interaction handling are executed on
the client side.

The system does not depend on external databases, authentication
services, or multiplayer infrastructure in its initial version.

## Assumptions and Constraints

The following assumptions and constraints apply to the project:

- Users access the application through a modern browser with WebGL
  support.

- The application is primarily designed for desktop environments.

- Mouse input is available for aiming and interaction.

- The system is developed as a standalone single-player experience.

- Internet connectivity is only required to access the application.

## Product Perspective

The system is developed as an independent web application intended to
demonstrate the capabilities of modern frontend technologies in creating
interactive real-time experiences.

Rather than focusing on large-scale game development, the project uses a
game scenario as a practical framework for exploring frontend
architecture, user interaction design, 3D rendering techniques, and
real-time state management within browser environments.

The application serves both as a functional product and as a technical
demonstration of frontend engineering concepts applied to computer
graphics.

## Product Functions

The system provides the following major functions:

- Render and manage a complete 3D environment.

- Display and control multiple waves of monsters.

- Allow players to observe, aim, and interact with the scene.

- Support projectile-based shooting mechanics.

- Detect collisions between projectiles and monsters.

- Manage weapon progression and unlocking mechanisms.

- Control game progression, victory conditions, and defeat conditions.

- Provide visual feedback through lighting, animation, and interactive
  effects.

# System Architecture

## Technology Stack

The application is developed using modern frontend technologies that
support interactive 3D rendering, real-time user interaction, and
maintainable software architecture.

  Technology     Purpose
  -------------- ---------------------------------------------
  Next.js        Application framework and routing system
  React          Component-based user interface architecture
  TypeScript     Static type checking and maintainability
  Three.js       3D rendering engine
  WebGL          Browser graphics rendering API
  Tailwind CSS   User interface styling
  GLTF / GLB     3D model format
  Git            Version control system

The selected technology stack enables the development of a browser-based
3D interactive application while maintaining scalability, modularity,
and code quality.

## Architecture Overview

The application follows a layered architecture that separates user
interface concerns, state management, gameplay logic, and rendering
responsibilities. This separation improves maintainability, scalability,
and extensibility.

::: center
  ----------------------------
          **UI Layer**
          $\downarrow$
   **State Management Layer**
          $\downarrow$
       **Systems Layer**
          $\downarrow$
      **Rendering Layer**
  ----------------------------
:::

### UI Layer

The UI Layer contains React components responsible for presenting
information and receiving user input. Examples include the game canvas,
heads-up display, control panel, and overlay screens.

### State Management Layer

The State Management Layer serves as the single source of truth for the
application. It stores gameplay data including player information, enemy
entities, projectiles, scores, wave progression, and game settings.

### Systems Layer

The Systems Layer implements gameplay mechanics through specialized
modules such as movement, collision detection, enemy spawning, shooting
logic, and wave management.

### Rendering Layer

The Rendering Layer manages the Three.js scene, camera configuration,
lighting setup, model loading, animation updates, and frame rendering.

## Game Loop Design

The application operates through a continuous game loop that processes
user input, updates application state, executes gameplay systems, and
renders the scene.

::: center
  ---------------------
        **Input**
      $\downarrow$
   **Dispatch Action**
      $\downarrow$
       **Reducer**
      $\downarrow$
    **Update State**
      $\downarrow$
     **Run Systems**
      $\downarrow$
    **Render Scene**
  ---------------------
:::

User actions are converted into application events. These events are
processed by reducers, resulting in state updates. Gameplay systems then
execute based on the latest state before the rendering layer updates the
visual scene.

## State Architecture

The application utilizes centralized state management to ensure
predictable behavior and consistent synchronization between gameplay
systems and user interface components.

Example structure:

``` {.java language="Java"}
type GameState = {
  status: "idle" | "playing" | "win" | "lose"

  player: {
    hp: number
  }

  enemies: Enemy[]
  bullets: Bullet[]

  score: number
  wave: number

  settings: {
    enemySpeed: number
    spawnRate: number
  }
}
```

The centralized state architecture simplifies data flow and provides a
consistent mechanism for updating gameplay information across the
application.

## UI Flow Document

### Main User Flow

The primary interaction flow experienced by the user is illustrated
below.

::: center
  -----------------------
      **Start Page**
       $\downarrow$
      **Start Game**
       $\downarrow$
     **Gameplay Loop**
       $\downarrow$
   **Wave Progression**
       $\downarrow$
   **Win / Lose Screen**
       $\downarrow$
        **Restart**
  -----------------------
:::

Users begin on the landing page, enter the gameplay environment,
progress through multiple waves, receive a final outcome, and may
restart the game.

### Gameplay Flow

The core gameplay interaction cycle is illustrated below.

::: center
  -------------------------
       **Mouse Input**
        $\downarrow$
      **Shoot Action**
        $\downarrow$
      **Bullet Spawn**
        $\downarrow$
   **Collision Detection**
        $\downarrow$
     **Enemy Destroyed**
        $\downarrow$
      **Score Update**
  -------------------------
:::

Players interact with the environment using mouse controls. Successful
shooting actions generate projectiles that may destroy enemies and
increase the player's score.

### Runtime Control Flow

Runtime settings can dynamically affect gameplay without restarting the
application.

::: center
  ----------------------------------
      **User Changes Settings**
             $\downarrow$
         **Dispatch Action**
             $\downarrow$
         **Update GameState**
             $\downarrow$
     **Systems Read New Values**
             $\downarrow$
   **Gameplay Changes Immediately**
  ----------------------------------
:::

This mechanism allows gameplay parameters to be adjusted while the game
remains active.

## State Diagram Document

### Game State Transition

  Current State   Event               Next State
  --------------- ------------------- ------------
  Idle            Start Game          Playing
  Playing         Victory Condition   Win
  Playing         Defeat Condition    Lose
  Win             Restart             Playing
  Lose            Restart             Playing

  : Game State Transitions

The application starts in the idle state and transitions to gameplay
when the user initiates a session. The session concludes with either a
victory or defeat outcome.

### Enemy State

  State       Description
  ----------- ----------------------------------
  Spawn       Enemy appears in the game world
  Move        Enemy advances toward the target
  Hit         Enemy receives damage
  Destroyed   Enemy is removed from the scene

  : Enemy State Lifecycle

Each enemy follows a predefined lifecycle from creation to removal.

### Bullet State

  State       Description
  ----------- --------------------------------------
  Spawn       Projectile is created
  Move        Projectile travels through the scene
  Collision   Projectile hits an enemy
  Remove      Projectile is removed from memory

  : Bullet State Lifecycle

Bullets are created by shooting actions and remain active until a
collision occurs or cleanup conditions are met.

# Functional Requirements

## Game Session Management

This subsystem controls the complete lifecycle of a gameplay session,
from the moment a user accesses the website until active gameplay
begins.

The subsystem is responsible for displaying the welcome page, creating a
new game session, initializing all gameplay data, presenting the
countdown sequence, and activating enemy spawning.

### FR-1 Welcome Screen

**Purpose**

Provide an entry point to the application and explain the objective of
the game before gameplay begins.

**Preconditions**

- The user accesses the website.

- The application has loaded successfully.

**Main Flow**

1.  The system displays the Welcome Screen.

2.  The system displays the game title.

3.  The system displays a short description explaining that the player
    must defend a house against incoming monsters.

4.  The system displays a Start Game button.

5.  The system waits for user interaction.

6.  The user clicks Start Game.

7.  The system transitions to the Gameplay Scene.

**Business Rules**

- BR-1: No gameplay logic shall execute while the Welcome Screen is
  active.

- BR-2: No enemies shall spawn while the Welcome Screen is active.

- BR-3: The Start Game button shall always be visible.

**Acceptance Criteria**

- The Welcome Screen is displayed immediately after accessing the
  website.

- The Start Game button is visible and clickable.

- Clicking Start Game transitions to the Gameplay Scene.

### FR-2 Game Initialization

**Purpose**

Prepare all gameplay resources and application state before gameplay
begins.

**Trigger**

The user clicks the Start Game button.

**Main Flow**

1.  The system creates a new game session.

2.  The system initializes the game state.

3.  The system loads all required 3D assets.

4.  The system creates the gameplay scene.

5.  The system creates the player entity.

6.  The system creates the house entity.

7.  The system initializes weapon progression.

8.  The system initializes wave progression.

9.  The system initializes the gameplay timer.

10. The system initializes enemy spawn managers.

11. The system displays the gameplay interface.

**Data Initialization**

The initial state shall be:

    GameStatus = Countdown
    CurrentWave = 1
    CurrentWeapon = Basic
    Score = 0
    EnemyCount = 0
    ElapsedTime = 0
    Countdown = 3

**Business Rules**

- BR-4: Previous game data shall not persist.

- BR-5: All enemies from previous sessions shall be removed.

- BR-6: The player always starts with the Basic weapon.

- BR-7: The game always starts at Wave 1.

**Acceptance Criteria**

- All game values are reset.

- Wave progression starts from Wave 1.

- The Basic weapon is equipped.

### FR-3 Countdown Sequence

**Purpose**

Provide a short preparation period before enemy spawning begins.

**Main Flow**

1.  The system displays \"3\".

2.  After 1 second, the system displays \"2\".

3.  After 1 second, the system displays \"1\".

4.  After 1 second, the system displays \"Ready\".

5.  After 1 second, the Ready message disappears.

6.  The system waits 3 additional seconds.

7.  The first enemy is spawned.

8.  The game state changes from Countdown to Playing.

**Timing Rules**

- TR-1: Each countdown value shall remain visible for exactly 1 second.

- TR-2: Enemy spawning is disabled during the countdown.

- TR-3: Enemy spawning is disabled while the Ready message is visible.

- TR-4: The first enemy shall appear exactly 3 seconds after the Ready
  message disappears.

**Acceptance Criteria**

- Countdown values appear in the correct order.

- Enemies do not appear before the countdown finishes.

- The first enemy appears after the required delay.

"'latex

## Gameplay Environment

The Gameplay Environment subsystem defines the virtual battlefield where
all gameplay interactions occur. It is responsible for creating the
playable area, positioning the protected house, defining enemy movement
boundaries, and providing valid target locations for player attacks.

The environment remains active throughout the entire gameplay session
and serves as the reference space for all entities including enemies,
projectiles, weapons, and user interactions.

### FR-5 Battlefield Initialization

**Purpose**

Create the playable area used during gameplay.

**Main Flow**

1.  The system creates the battlefield.

2.  The system loads environmental models.

3.  The system loads the house model.

4.  The system loads fence models.

5.  The system positions all environment objects.

6.  The system enables gameplay interactions.

**Business Rules**

- BR-8: The battlefield shall remain visible throughout gameplay.

- BR-9: Environmental objects shall not be removed during a session.

- BR-10: The house shall always remain at the center of the battlefield.

**Acceptance Criteria**

- The battlefield loads successfully.

- The house is visible.

- The fence is visible.

### FR-6 House Placement

**Purpose**

Define the protected target that players must defend.

**Business Rules**

- BR-11: The house shall be positioned at the center of the battlefield.

- BR-12: The front side of the house shall span the width of the
  playable area.

- BR-13: The house shall act as the final objective for enemy movement.

**Acceptance Criteria**

- All enemies move toward the house.

- The house remains visible throughout gameplay.

### FR-7 Target Area Interaction

**Purpose**

Provide valid locations where players can aim and attack.

**Business Rules**

- BR-14: Players may only target positions located inside the
  battlefield.

- BR-15: Mouse clicks outside the battlefield shall be ignored.

- BR-16: Every valid click shall generate a target position.

**Acceptance Criteria**

- Valid clicks generate target positions.

- Invalid clicks do not trigger attacks.

"'

"'latex

## Enemy System

The Enemy System manages enemy creation, movement, health, damage
reception, and destruction.

Three enemy classes are supported.

### FR-8 Enemy Types

**Business Rules**

- BR-17: The Easy enemy shall have 100 HP.

- BR-18: The Easy enemy shall reach the house in approximately 20 seconds
  if uninterrupted.

- BR-19: The Medium enemy shall have 200 HP.

- BR-20: The Medium enemy shall reach the house in approximately 25
  seconds if uninterrupted.

- BR-21: The Hard enemy shall have 400 HP.

- BR-22: The Hard enemy shall reach the house in approximately 30
  seconds if uninterrupted.

### FR-9 Enemy Spawn

**Purpose**

Create enemies during active gameplay.

**Business Rules**

- BR-23: The first enemy shall appear 3 seconds after the Ready message
  disappears.

- BR-24: Enemies shall spawn outside the protected area.

- BR-25: Spawned enemies shall immediately enter the Move state.

### FR-10 Enemy Movement

**Purpose**

Move enemies toward the house.

**Business Rules**

- BR-26: Enemies shall continuously move toward the house.

- BR-27: Enemy movement shall not follow a perfectly straight path.

- BR-28: Small random directional offsets shall be applied during
  movement.

- BR-29: Enemy movement shall appear natural and distributed across the
  battlefield.

- BR-30: Enemies shall not intentionally cluster into a single point.

### FR-11 Enemy Health

**Business Rules**

- BR-31: Enemies shall lose health when receiving damage.

- BR-32: Enemy health shall never exceed the maximum value assigned to
  its type.

- BR-33: An enemy shall be destroyed when health reaches zero.

"'

"'latex

## Weapon System

The Weapon System controls weapon progression and damage capabilities.

### FR-12 Basic Weapon

**Business Rules**

- BR-34: The Basic weapon shall be the starting weapon.

- BR-35: Normal attacks shall deal 30 damage.

- BR-36: Every third normal attack shall generate one Big Shot.

- BR-37: The Big Shot shall deal 50 damage.

- BR-38: The Basic weapon shall have the slowest projectile travel time.

- BR-130: The Basic weapon shall require 2 seconds to reload before it
  can fire again.

### FR-13 Medium Weapon

**Business Rules**

- BR-39: The Medium weapon shall be unlocked after completing Wave 1.

- BR-40: Normal attacks shall deal 50 damage.

- BR-41: Every fourth normal attack shall generate one Big Shot.

- BR-42: The Big Shot shall deal 70 damage.

- BR-43: Projectile travel speed shall be faster than the Basic weapon.

- BR-131: The Medium weapon shall require 3 seconds to reload before it
  can fire again.

### FR-14 Advanced Weapon

**Business Rules**

- BR-44: The Advanced weapon shall be unlocked after completing Wave 2.

- BR-45: Each attack shall fire two projectiles.

- BR-46: Each projectile shall deal 50 damage.

- BR-47: Every fifth normal attack shall generate one Big Shot.

- BR-48: The Big Shot shall deal 100 damage.

- BR-49: Projectile travel speed shall be the fastest among all weapons.

- BR-132: The Advanced weapon shall require 4 seconds to reload before it
  can fire again.

**Weapon Reload Times**

::: center
  Weapon      Reload Time
  ---------- -------------
  Basic         2 Seconds
  Medium        3 Seconds
  Advanced      4 Seconds
:::

More powerful weapons reload more slowly, balancing their higher damage
and additional projectiles.

"'

"'latex

## Shooting and Damage System

The Shooting and Damage System manages all combat interactions between
the player and enemies. It is responsible for processing mouse input,
determining target locations, spawning projectiles, simulating
projectile trajectories, calculating damage, and updating enemy health.

This subsystem represents the primary gameplay interaction mechanism and
directly affects player success and game progression.

### FR-15 Target Selection

**Purpose**

Allow players to select a target location within the battlefield.

**Trigger**

The player presses the left mouse button.

**Preconditions**

- The game state is Playing.

- The click position is located inside the playable battlefield.

**Main Flow**

1.  The player clicks a location on the battlefield.

2.  The system performs a raycast from the camera through the mouse
    position.

3.  The system determines the world-space intersection point.

4.  The system validates that the intersection point is located inside
    the battlefield.

5.  The system stores the target position.

6.  The system displays a visual target marker (\"X\") at the selected
    position.

7.  The system immediately triggers a shooting action.

**Business Rules**

- BR-50: Only locations inside the battlefield shall be considered valid
  targets.

- BR-51: Invalid clicks shall be ignored.

- BR-52: A target marker shall appear immediately after a valid click.

- BR-53: The target marker shall indicate the intended projectile
  landing position.

**Acceptance Criteria**

- Valid clicks generate a target marker.

- Invalid clicks do not generate a target marker.

- The marker appears at the selected position.

### FR-16 Projectile Creation

**Purpose**

Create projectiles when the player performs a shooting action.

**Trigger**

A valid target location is selected.

**Main Flow**

1.  The system identifies the currently equipped weapon.

2.  The system determines projectile properties.

3.  The system creates one or more projectile entities.

4.  The system assigns a launch position.

5.  The system assigns a target position.

6.  The projectile enters the Moving state.

**Business Rules**

- BR-54: The projectile shall be spawned immediately after a valid
  click.

- BR-55: The projectile origin shall be the weapon position.

- BR-56: The projectile target shall be the selected target position.

- BR-57: Advanced Weapon attacks shall spawn two projectiles.

- BR-133: A shooting action shall be ignored while the equipped weapon is
  reloading; no projectile or target marker shall be created until the
  reload completes (BR-130..132).

**Acceptance Criteria**

- Projectiles are created successfully.

- Projectile quantity matches weapon specifications.

### FR-17 Projectile Movement

**Purpose**

Simulate projectile travel from the weapon to the target location.

**Business Rules**

- BR-58: Projectiles shall follow an arcing trajectory.

- BR-59: Projectiles shall not move in a straight line.

- BR-60: The projectile shall always land at the selected target
  position.

- BR-61: Projectile travel time depends on the equipped weapon.

**Projectile Travel Speeds**

::: center
  Weapon      Travel Speed
  ---------- --------------
  Basic           Slow
  Medium         Medium
  Advanced        Fast
:::

**Acceptance Criteria**

- Projectiles visibly travel through the air.

- Projectiles land at the selected target location.

- Faster weapons reach the target sooner.

### FR-18 Big Shot Mechanic

**Purpose**

Provide periodic high-damage attacks.

**Business Rules**

- BR-62: Each weapon shall maintain an attack counter.

- BR-63: Only normal attacks contribute to the counter.

- BR-64: Reaching the required attack count shall prepare the next shot
  as a Big Shot.

**Big Shot Requirements**

::: center
  Weapon      Trigger Count   Damage
  ---------- --------------- --------
  Basic          3 Shots        50
  Medium         4 Shots        70
  Advanced       5 Shots       100
:::

**Acceptance Criteria**

- Big Shots are generated at the correct intervals.

- Big Shots deal the correct amount of damage.

### FR-19 Damage Calculation

**Purpose**

Determine the amount of damage applied to enemies.

**Trigger**

A projectile reaches its target position.

**Main Flow**

1.  The projectile lands at the target position.

2.  The system calculates the distance between each enemy and the
    landing position.

3.  The system determines damage based on distance.

4.  The system reduces enemy health.

5.  The system checks whether the enemy has been destroyed.

**Business Rules**

- BR-65: Damage is calculated only when the projectile lands.

- BR-66: Damage is based on the enemy position at the moment of impact.

- BR-67: Enemies closer to the impact point receive more damage.

- BR-68: Enemies farther from the impact point receive less damage.

- BR-69: An enemy positioned exactly at the impact point receives full
  weapon damage.

**Damage Formula**

Let:

$$Distance = d$$

$$MaxRadius = R$$

$$WeaponDamage = D$$

Damage shall be calculated as:

$$Damage = D \times \left(1 - \frac{d}{R}\right)$$

for:

$$0 \le d \le R$$

If:

$$d > R$$

then:

$$Damage = 0$$

**Acceptance Criteria**

- Enemies at the center of impact receive full damage.

- Damage decreases as distance increases.

- Enemies outside the damage radius receive no damage.

### FR-20 Enemy Destruction

**Purpose**

Remove enemies that have been defeated.

**Business Rules**

- BR-70: Enemy health shall never be less than zero.

- BR-71: An enemy shall enter the Destroyed state when health reaches
  zero.

- BR-72: Destroyed enemies shall be removed from the active enemy list.

- BR-73: Destroyed enemies shall no longer participate in movement or
  collision processing.

**Acceptance Criteria**

- Defeated enemies are removed from gameplay.

- Destroyed enemies no longer receive updates.

"'

"'latex

## Wave Progression System

The Wave Progression System manages enemy composition, enemy spawning
schedules, weapon progression, and transitions between waves.

The game consists of three waves. Each wave contains a predefined number
of enemies with increasing difficulty. A wave is considered completed
when all enemies belonging to that wave have been destroyed.

### FR-21 Wave Configuration

**Purpose**

Define the composition of each gameplay wave.

**Business Rules**

- BR-74: The game shall contain exactly three waves.

- BR-75: Wave 1 shall contain two Easy enemies and one Medium enemy.

- BR-76: Wave 2 shall contain two Easy enemies, two Medium enemies, and
  one Hard enemy.

- BR-77: Wave 3 shall contain two Easy enemies, two Medium enemies, and
  three Hard enemies.

- BR-78: Enemy quantities shall remain fixed throughout all game
  sessions.

**Wave Composition**

::: center
   Wave   Easy   Medium   Hard   Total
  ------ ------ -------- ------ -------
    1      2       1       0       3
    2      2       2       1       5
    3      2       2       3       7
:::

**Acceptance Criteria**

- Each wave contains the correct enemy composition.

- Enemy quantities match the predefined configuration.

### FR-22 Enemy Spawn Scheduling

**Purpose**

Control the timing of enemy creation.

**Business Rules**

- BR-79: Easy enemies shall spawn every 3 seconds.

- BR-80: Medium enemies shall spawn every 4 seconds.

- BR-81: Hard enemies shall spawn every 5 seconds.

- BR-82: Enemies shall spawn sequentially.

- BR-83: A spawned enemy shall immediately enter the Move state.

- BR-84: Enemy spawning shall stop when all enemies belonging to the
  current wave have been created.

**Spawn Timing**

::: center
   Enemy Type   Spawn Interval
  ------------ ----------------
      Easy        3 Seconds
     Medium       4 Seconds
      Hard        5 Seconds
:::

**Acceptance Criteria**

- Enemies appear according to the specified schedule.

- No enemy spawns before its designated interval.

### FR-23 Wave Completion

**Purpose**

Determine when a wave has been successfully completed.

**Business Rules**

- BR-85: A wave shall be completed when all enemies assigned to the wave
  have been destroyed.

- BR-86: A wave shall not complete while at least one enemy remains
  alive.

- BR-87: Enemy spawn schedules shall stop immediately after wave
  completion.

**Acceptance Criteria**

- The system correctly detects wave completion.

- Wave completion occurs only after all enemies are eliminated.

### FR-24 Wave Transition

**Purpose**

Transition from the current wave to the next wave.

**Main Flow**

1.  The current wave is completed.

2.  The system displays a wave transition message.

3.  The transition message remains visible for 3 seconds.

4.  The next wave configuration is loaded.

5.  Enemy spawning begins for the next wave.

**Business Rules**

- BR-88: The message shall display the upcoming wave number.

- BR-89: The message shall remain visible for exactly 3 seconds.

- BR-90: Enemy spawning shall not occur while the transition message is
  displayed.

**Acceptance Criteria**

- The transition message appears after every completed wave.

- The next wave begins after the required delay.

### FR-25 Weapon Progression

**Purpose**

Reward players with stronger weapons as they progress.

**Business Rules**

- BR-91: The player shall start the game with the Basic Weapon.

- BR-92: The Medium Weapon shall be unlocked after completing Wave 1.

- BR-93: The Advanced Weapon shall be unlocked after completing Wave 2.

- BR-94: Newly unlocked weapons shall automatically become active.

- BR-95: Weapon progression shall reset when a new game starts.

**Acceptance Criteria**

- Weapon upgrades occur at the correct wave boundaries.

- The active weapon matches the current progression level.

"'

## Runtime Control System

The Runtime Control System allows players to manage the execution state
of an active gameplay session without leaving the game environment.

The subsystem provides controls for pausing, resuming, and restarting
the game while maintaining consistent synchronization between the user
interface and the application state.

### FR-26 Pause Functionality

**Purpose**

Temporarily suspend gameplay while preserving the current game state.

**Trigger**

The player presses the Pause button.

**Preconditions**

- The game state is Playing.

**Main Flow**

1.  The player presses Pause.

2.  The system changes the game state to Paused.

3.  Enemy movement is suspended.

4.  Enemy spawning is suspended.

5.  Projectile movement is suspended.

6.  Gameplay timers are suspended.

7.  The Pause overlay is displayed.

**Business Rules**

- BR-96: No gameplay updates shall occur while the game is paused.

- BR-97: The current game state shall be preserved.

- BR-98: User interface elements shall remain visible.

**Acceptance Criteria**

- Enemy movement stops immediately.

- Projectiles stop immediately.

- Gameplay timers stop updating.

### FR-27 Resume Functionality

**Purpose**

Continue gameplay from a paused state.

**Trigger**

The player presses the Resume button.

**Preconditions**

- The game state is Paused.

**Main Flow**

1.  The player presses Resume.

2.  The system changes the game state to Playing.

3.  Enemy movement resumes.

4.  Enemy spawning resumes.

5.  Projectile movement resumes.

6.  Gameplay timers resume.

7.  The Pause overlay is removed.

**Business Rules**

- BR-99: Gameplay shall continue from the exact state prior to pausing.

- BR-100: No game data shall be reset during resume.

**Acceptance Criteria**

- Gameplay continues from the previous state.

- Enemy and projectile movement resume correctly.

### FR-28 Restart Functionality

**Purpose**

Start a completely new gameplay session.

**Trigger**

The player presses the Restart button.

**Main Flow**

1.  The player presses Restart.

2.  The current session is terminated.

3.  All active enemies are removed.

4.  All active projectiles are removed.

5.  Wave progression is reset.

6.  Weapon progression is reset.

7.  The gameplay timer is reset.

8.  A new game session is initialized.

9.  The countdown sequence begins.

**Business Rules**

- BR-101: Restart shall always begin at Wave 1.

- BR-102: Restart shall always equip the Basic Weapon.

- BR-103: No gameplay data shall persist between sessions.

**Acceptance Criteria**

- A completely new game session begins.

- Previous session data is removed.

## Victory and Defeat System

The Victory and Defeat System determines the outcome of a gameplay
session and presents the appropriate end-game interface to the player.

### FR-29 Defeat Condition

**Purpose**

Detect when the player fails to defend the house.

**Business Rules**

- BR-104: A defeat shall occur when any enemy crosses the battlefield
  boundary protecting the house.

- BR-105: Defeat shall be triggered immediately upon boundary violation.

- BR-106: Enemy health and remaining enemies shall not affect defeat
  evaluation.

**Acceptance Criteria**

- The game immediately ends when an enemy reaches the protected area.

- The game state changes to Lose.

### FR-30 Defeat Screen

**Purpose**

Inform the player that the game has been lost.

**Main Flow**

1.  A defeat condition is detected.

2.  The game state changes to Lose.

3.  All gameplay updates stop.

4.  A Lose overlay is displayed.

5.  A Restart button is displayed.

**Business Rules**

- BR-107: Enemy spawning shall stop.

- BR-108: Enemy movement shall stop.

- BR-109: Projectile updates shall stop.

**Acceptance Criteria**

- The Lose overlay is displayed.

- The Restart button is available.

### FR-31 Victory Condition

**Purpose**

Detect successful completion of the game.

**Business Rules**

- BR-110: Victory shall occur after Wave 3 has been completed.

- BR-111: All enemies belonging to Wave 3 shall be destroyed.

- BR-112: No active enemies may remain in the game world.

**Acceptance Criteria**

- Victory is triggered only after all Wave 3 enemies are defeated.

- The game state changes to Win.

### FR-32 Victory Screen

**Purpose**

Inform the player that the game has been successfully completed.

**Main Flow**

1.  The victory condition is detected.

2.  The game state changes to Win.

3.  Gameplay updates stop.

4.  A Victory overlay is displayed.

5.  A Return to Start Page button is displayed.

**Business Rules**

- BR-113: Enemy spawning shall stop.

- BR-114: Enemy movement shall stop.

- BR-115: Projectile updates shall stop.

**Acceptance Criteria**

- The Victory overlay is displayed.

- The Return to Start Page button is available.

### FR-33 Return to Start Page

**Purpose**

Allow players to return to the Welcome Screen after winning.

**Trigger**

The player presses the Return to Start Page button.

**Main Flow**

1.  The player presses Return to Start Page.

2.  The current session is terminated.

3.  All gameplay data is cleared.

4.  The Welcome Screen is displayed.

**Acceptance Criteria**

- The Welcome Screen is displayed.

- A new session can be started.

## Heads-Up Display (HUD)

The Heads-Up Display (HUD) provides real-time gameplay information and
controls without interrupting gameplay.

The HUD shall remain visible throughout active gameplay and shall
continuously synchronize with the current game state.

### FR-30 Wave Information Display

**Purpose**

Display the current progression of the game.

**Business Rules**

- BR-96: The current wave number shall be displayed.

- BR-97: The displayed wave shall update immediately after a wave
  transition.

- BR-98: The wave indicator shall remain visible during gameplay.

**Acceptance Criteria**

- The correct wave number is displayed.

- Wave updates are reflected immediately.

### FR-31 Gameplay Timer

**Purpose**

Display the elapsed gameplay time.

**Business Rules**

- BR-99: The timer shall start when gameplay enters the Playing state.

- BR-100: The timer shall update every second.

- BR-101: The timer shall pause when the game is paused.

- BR-102: The timer shall stop when the game ends.

**Acceptance Criteria**

- The timer increases correctly.

- The timer pauses and resumes correctly.

## Rendering System

The Rendering System is responsible for displaying all visual elements
of the game world using Three.js and WebGL.

The subsystem converts application state into a visual representation
that can be observed and interacted with by the player.

### FR-32 Scene Rendering

**Purpose**

Render the complete gameplay environment.

**Business Rules**

- BR-103: The battlefield shall be rendered continuously.

- BR-104: The house shall be rendered throughout gameplay.

- BR-105: Enemy entities shall be rendered while active.

- BR-106: Projectiles shall be rendered while active.

- BR-107: Destroyed entities shall no longer be rendered.

### FR-33 Camera Management

**Purpose**

Provide a consistent view of the battlefield.

**Business Rules**

- BR-108: The application shall use a perspective camera.

- BR-109: The entire battlefield shall remain visible.

- BR-110: Camera positioning shall support accurate target selection.

### FR-34 Lighting System

**Purpose**

Provide visual clarity and depth perception.

**Business Rules**

- BR-111: Ambient lighting shall illuminate the scene.

- BR-112: Directional lighting shall simulate sunlight.

- BR-113: Major scene objects shall support shadow rendering.

### FR-35 Animation Rendering

**Purpose**

Display visual motion of entities.

**Business Rules**

- BR-114: Enemy movement shall be animated.

- BR-115: Projectile movement shall be animated.

- BR-116: Target markers shall be rendered immediately after selection.

- BR-117: Animations shall update every render frame.

### FR-40 Damage Hit Feedback

**Purpose**

Give the player clear visual confirmation that a projectile damaged an
enemy.

**Trigger**

An enemy's health is reduced by a projectile impact.

**Main Flow**

1.  A projectile lands and applies area-of-effect damage.

2.  Each enemy that loses health briefly flashes a red glow.

3.  The glow fades out over a short duration.

4.  The enemy resumes its normal appearance.

**Business Rules**

- BR-134: An enemy that receives damage shall display a red glow (hit
  flash).

- BR-135: The hit flash shall be brief and fade out automatically.

- BR-136: Enemies that receive no damage shall not flash.

- BR-137: The hit flash shall be purely visual and shall not affect enemy
  health, movement, or collision.

**Acceptance Criteria**

- Damaged enemies visibly flash red on impact.

- The flash fades shortly after the hit.

- Enemies outside the blast radius do not flash.

## Physics and Collision System

The Physics and Collision System manages projectile movement, impact
detection, and spatial calculations required by gameplay mechanics.

### FR-36 Projectile Physics

**Purpose**

Simulate projectile travel through the battlefield.

**Business Rules**

- BR-118: Projectiles shall follow a ballistic trajectory.

- BR-119: Projectile travel time shall depend on the equipped weapon.

- BR-120: Projectiles shall land exactly at the selected target
  position.

### FR-37 Impact Detection

**Purpose**

Detect projectile arrival at the target position.

**Business Rules**

- BR-121: An impact event shall occur when a projectile reaches its
  target position.

- BR-122: Impact processing shall execute only once per projectile.

- BR-123: The projectile shall enter the Remove state after impact.

### FR-38 Area-of-Effect Collision

**Purpose**

Determine which enemies are affected by an impact.

**Business Rules**

- BR-124: The system shall calculate the distance between the impact
  point and every active enemy.

- BR-125: Enemies within the effect radius shall receive damage.

- BR-126: Enemies outside the effect radius shall receive no damage.

### FR-39 Entity Cleanup

**Purpose**

Remove inactive entities from the game world.

**Business Rules**

- BR-127: Destroyed enemies shall be removed.

- BR-128: Expired projectiles shall be removed.

- BR-129: Removed entities shall no longer participate in updates or
  rendering.

# Non-Functional Requirements

## Performance Requirements

The application shall maintain an average frame rate of at least 30 FPS
under normal gameplay conditions on a modern desktop browser.

The system shall render user interactions, animations, and scene updates
with minimal perceptible delay.

The loading time for the initial game scene should not exceed 10 seconds
under normal network conditions.

The application shall efficiently manage 3D assets and memory usage to
prevent significant performance degradation during gameplay.

The system shall support real-time updates of game entities, animations,
and visual effects without causing noticeable interruptions to the user
experience.

## Usability Requirements

The application shall provide an intuitive user interface that allows
users to understand the gameplay mechanics without extensive
instructions.

User interactions shall be performed using standard mouse controls
commonly available on desktop devices.

The visual feedback generated by the system shall clearly indicate
successful actions, collisions, and game state transitions.

The interface shall present relevant gameplay information through HUD
elements and overlay screens when necessary.

The system shall provide clear indications of victory, defeat, and game
progression.

## Reliability Requirements

The application shall maintain stable operation throughout a complete
gameplay session.

Unexpected user inputs shall not cause application crashes or
unresponsive states.

The system shall correctly manage game state transitions between
initialization, active gameplay, pause, victory, and defeat states.

The application shall ensure that game entities are properly created,
updated, and removed during runtime.

The system shall recover gracefully from asset loading failures whenever
possible.

## Compatibility Requirements

The application shall support modern desktop web browsers that provide
WebGL support.

The system shall be compatible with recent versions of Google Chrome,
Microsoft Edge, Mozilla Firefox, and other Chromium-based browsers.

The application shall operate without requiring users to install
additional software or plugins.

The system shall be deployable as a standard web application using the
Next.js framework.

## Maintainability Requirements

The source code shall follow a modular architecture to facilitate future
development and maintenance activities.

Application logic, rendering logic, user interface components, and state
management mechanisms shall be separated into independent modules
whenever possible.

The project shall utilize TypeScript to improve code reliability,
readability, and maintainability through static type checking.

Reusable components and utility functions shall be organized to minimize
code duplication.

The codebase shall support future feature additions with minimal impact
on existing functionality.

# Future Enhancements

Although the current implementation focuses on the core gameplay and
frontend architecture defined in the project proposal, the system has
been designed with extensibility in mind. Several enhancements may be
considered in future development phases.

## Player Ranking System

A ranking system may be implemented to compare player performance across
multiple gameplay sessions.

Metrics such as completion time, accuracy, defeated enemies, and
achieved scores could be recorded and displayed through leaderboards.

The ranking system would require backend support for data storage and
synchronization between users.

## Backend Integration

A backend service may be introduced to support persistent data storage
and online functionality.

Potential features include player accounts, game progress tracking,
statistics collection, cloud-based configuration management, and
persistent gameplay records.

The integration could be implemented using a REST API or modern backend
frameworks while preserving the existing frontend architecture.

## Additional Monster Types

Future versions of the application may introduce new monster types with
distinct visual appearances, movement patterns, health values, and
attack behaviors.

Additional enemy variations could increase gameplay diversity and
provide more complex interaction scenarios for the player.

## Additional Weapons

The weapon system may be extended to support a larger variety of
weapons, each with unique projectile properties, firing rates, damage
values, and visual effects.

Examples include explosive projectiles, rapid-fire weapons,
area-of-effect attacks, and specialized defensive weapons.

# Enemy Health Indicator

### FR-41 Enemy Health Bar

**Purpose**

Show each enemy's remaining health directly above it, so the player can
gauge how close a monster is to being destroyed and prioritize targets.

**Main Flow**

1.  When an enemy appears, a health bar is displayed above it.

2.  The bar always faces the camera.

3.  The filled portion reflects the enemy's current health as a fraction
    of its maximum health.

4.  The fill color transitions from green through yellow to red as the
    enemy loses health.

5.  The bar follows the enemy as it moves and is removed when the enemy
    is destroyed.

**Business Rules**

- BR-138: A health bar shall be displayed above every enemy from the
  moment it spawns.

- BR-139: The filled length of the bar shall be proportional to the
  enemy's current health divided by its maximum health.

- BR-140: The fill color shall transition from green (full health)
  through yellow to red (low health).

- BR-141: The health bar shall always face the camera.

- BR-142: The health bar shall follow the enemy and shall be removed when
  the enemy is destroyed.

- BR-143: The health bar shall be purely visual and shall not affect enemy
  health, movement, or collision.

**Acceptance Criteria**

- Every enemy displays a health bar as soon as it spawns.

- The bar shrinks and changes color as the enemy loses health.

- The bar disappears when the enemy is destroyed.
