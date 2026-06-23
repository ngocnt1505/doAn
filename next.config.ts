import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `better-sqlite3` is a native (.node) module used by the leaderboard API
  // routes. Tell Next to load it from node_modules at runtime instead of trying
  // to bundle it into the server output (which breaks native addons).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
