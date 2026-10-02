import type { Metadata } from "next";
import Link from "next/link";
import { parseFolioCard, shareCardImageUrl, sharePageUrl, shareText } from "@/lib/folio-card";
import { usd } from "@/lib/format";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

function toParams(raw: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) params.set(key, first);
  }
  return params;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Query> }): Promise<Metadata> {
  const params = toParams(await searchParams);
  const card = parseFolioCard(params);
  const query = params.toString();
  const image = shareCardImageUrl(query);
  const title = card.sample ? "Sample folio" : `Rewards received ${usd(card.rewardsUsd)}`;
  const description = shareText(card);
  return {
    title: { absolute: `${title} · StonkFolio` },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: sharePageUrl(query),
      siteName: "StonkFolio",
      type: "website",
      locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@StonkfolioArc",
      creator: "@StonkfolioArc",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const params = toParams(await searchParams);
  const card = parseFolioCard(params);
  const image = `/share/card.png?${params.toString()}`;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
      <img src={image} alt={shareText(card)} width={1200} height={630} className="w-full rounded-xl" />
      <p className="text-sm text-muted">{shareText(card)}</p>
      <Link
        href="/portfolio"
        className="inline-flex h-11 w-fit items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg"
      >
        Open Folio
      </Link>
    </div>
  );
}
