import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth";

const SITE = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3001");
const TITLE = "Squeaks ($SQKS) | The loudest meme in the trenches";
const DESC = "The official meme token of CardicX on Solana. Play free arcade games, earn Cheese, collect the 444 CDXLIV mice and squeak louder than the rest.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  openGraph: {
    type: "website", siteName: "Squeaks", title: TITLE, description: DESC, url: "/",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "The Squeaks mice waving from giant cheese letters spelling SQKS" }],
  },
  twitter: { card: "summary_large_image", site: "@squeaksfun", title: TITLE, description: DESC, images: ["/og.jpg"] },
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
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
