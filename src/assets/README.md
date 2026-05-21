# src/assets

Static art and audio that ships INSIDE the source tree (so it's bundled and
versioned with the code).

- `models/`   — glTF / OBJ meshes that entities load at runtime
- `textures/` — image maps used by materials
- `sounds/`  — short SFX triggered by the event bus

Files large enough to bypass the bundler should live in the top-level
`public/` directory instead (Next.js serves it as static assets).
