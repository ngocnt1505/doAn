import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Vitest config for the pure-logic unit tests (reducer, systems). We only need to
// teach it the `@/` path alias the app uses; the reducer has no Three.js / DOM
// dependencies, so a plain Node environment is enough.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
