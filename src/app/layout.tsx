import type { Metadata } from "next";
import { Figtree, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const description = "Every trade buys the book. A small slice stays in USYC. Holders get the stocks.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stonkfolio.me"),
  title: {
    default: "StonkFolio",
    template: "%s · StonkFolio",
  },
  description,
  openGraph: {
    title: "The book that buys itself.",
    description,
    url: "https://www.stonkfolio.me",
    siteName: "StonkFolio",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        secureUrl: "https://www.stonkfolio.me/og.jpg",
        width: 1200,
        height: 630,
        alt: "StonkFolio. The book that buys itself.",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The book that buys itself.",
    description,
    site: "@StonkfolioArc",
    creator: "@StonkfolioArc",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "StonkFolio. The book that buys itself.",
      },
    ],
  },
  other: {
    "theme-color": "#07111f",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      prefix="og: http://ogp.me/ns#"
      className={`${figtree.variable} ${fraunces.variable} ${plex.variable} ${figtree.className} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-fg">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
