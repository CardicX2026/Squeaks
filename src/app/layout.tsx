import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const head = Fredoka({ variable: "--font-head", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "Squeaks — Play Cheese Chase, grow your Burrow",
  description:
    "The playful home of Squeaks: run Cheese Chase, grow your burrow, climb the leaderboard and learn about the token.",
};

export const viewport: Viewport = { themeColor: "#0b1028" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${head.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
