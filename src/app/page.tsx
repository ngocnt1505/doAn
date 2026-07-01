// The site root (route "/") just forwards to the gameplay route. The welcome
// screen is the in-scene overlay on /game (status "idle").

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/game");
}
