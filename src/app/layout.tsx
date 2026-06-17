import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D House Defense",
  description:
    "A browser-based 3D house-defense game built with Next.js and Three.js.",
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
