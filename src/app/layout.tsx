import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squeaks ($SQKS) — The loudest mouse in the trenches",
  description:
    "Squeaks is a meme-culture community on Solana with real products behind it: the CDXLIV NFT membership, Cheese Chase, merch and rewards that plug into CardicX.",
};

export const viewport: Viewport = { themeColor: "#0b1028" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
