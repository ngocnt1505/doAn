/* =============================================================================
 * src/app/layout.tsx
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   Root layout for the Next.js App Router. Wraps EVERY route in the app with
 *   the <html> / <body> shell and imports the single global stylesheet.
 *
 * WHY IT EXISTS
 *   Next.js requires exactly one root layout. It is rendered on the server,
 *   never re-mounts between route changes, and is the right place to put any
 *   markup or providers that must persist for the lifetime of the tab.
 *
 * WHAT BELONGS HERE
 *   - <html> / <body> tags and lang attribute
 *   - Global <head> metadata via the `metadata` export
 *   - Top-level providers (theme, store, etc.) if they wrap every route
 *   - One-time global stylesheet import
 *
 * WHAT DOES NOT BELONG HERE
 *   - Page content (use `page.tsx` files)
 *   - Game logic, Three.js, or anything browser-only that should live in a
 *     client component
 *   - Per-route layout decisions (use nested `layout.tsx` files instead)
 * ============================================================================= */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Interactive App — Thesis Project",
  description:
    "An educational frontend architecture for a state-driven Three.js game.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
