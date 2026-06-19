/* =============================================================================
 * src/app/page.tsx  (route: "/")
 * -----------------------------------------------------------------------------
 * The site root just forwards to the gameplay route. The single Welcome Screen
 * (SRS FR-1) is the in-scene overlay on `/game` (status "idle"), which the state
 * machine also returns to on "Return to Start Page" — so there's no separate
 * landing page to avoid showing two welcome screens for the same purpose.
 * ============================================================================= */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/game");
}
