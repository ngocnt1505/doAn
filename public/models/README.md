# public/models/

Runtime-loaded 3D models (`.glb`). Next.js serves this folder at the site root,
so `public/models/house.glb` is fetched at runtime from `/models/house.glb` by
the `GLTFLoader` (see `src/lib/modelCache.ts`).

The expected files (keys and paths are defined in `src/lib/models.ts`):

| Drop this file here       | Used for                          |
| ------------------------- | --------------------------------- |
| `house.glb`               | the protected house (FR-6)        |
| `fence.glb`               | perimeter fence (FR-5)            |
| `enemy-easy.glb`          | Easy enemy — 100 HP, fastest (FR-8) |
| `enemy-medium.glb`        | Medium enemy — 200 HP (FR-8)      |
| `enemy-hard.glb`          | Hard enemy — 400 HP, slowest (FR-8) |
| `weapon-basic.glb`        | Basic cannon (FR-12)              |
| `weapon-medium.glb`       | Medium weapon (FR-13)             |
| `weapon-advanced.glb`     | Advanced weapon (FR-14)           |

To use a different filename, edit `MODEL_PATHS` in `src/lib/models.ts`.

Missing files are skipped with a console warning (the game still runs), so you
can add them one at a time.
