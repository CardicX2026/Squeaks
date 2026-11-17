import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squeaks — Play Cheese Chase, grow your Burrow",
  description:
    "The playful home of Squeaks: run Cheese Chase, grow your burrow, climb the leaderboard and learn about the token.",
};

export const viewport: Viewport = { themeColor: "#0b1028" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
