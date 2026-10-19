import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";

const title = "Stonkfolio — Next-open paper calls";
const description =
  "Next-open paper calls on stock tokens. Eve’s Gap board for NVDA, QQQ, and SPY stock tokens — scoreboard only.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://www.stonkfolio.me",
    siteName: "Stonkfolio",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
    site: "@StonkfolioArc",
    creator: "@StonkfolioArc",
  },
};

export default function Page() {
  return <HomeView />;
}
