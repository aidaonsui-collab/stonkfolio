"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EVE_LAUNCH, TOKEN } from "@/lib/chain";
import { compactUsd } from "@/lib/format";
import { protocolPreview, sleeveWeight, STOCKS } from "@/lib/stocks";
import { Button } from "./ui/button";
import { BundleMap } from "./bundle-map";
import { TickerTape } from "./ticker-tape";

const CHAPTERS = [
  {
    title: "Launch.",
    body: `Instant on eve.fun. 1B ${TOKEN.symbol} against USDC, LP locked. Point the rewards wallet at the Stonkfolio keeper — that 50% creator USDC is the only input.`,
  },
  {
    title: "The buy.",
    body: "The keeper spends only on this bundle. CRCL, NVDA, AAPL, the index sleeve, BUIDL/USYC cash — and only after those names list on Arc 5042.",
  },
  {
    title: "The farm.",
    body: "Distributed stocks land with holders. Put them to work on Morpho isolated markets, Aave V4, and Uniswap LPs Arc already posted.",
  },
];

export function HomeView() {
  const pulse = protocolPreview();
  const equity = sleeveWeight("equity");
  const index = sleeveWeight("index");
  const cash = sleeveWeight("mmf");

  return (
    <div>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-10 pb-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="stagger-in">
          <p className="kicker">$STONK · Arc 5042 · eve.fun Instant</p>
          <h1 className="display mt-5 text-fg">
            The book
            <br />
            that buys
            <span className="italic"> itself.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Creator fees from Instant auto-buy a curated sleeve of tokenized names. Holders receive the stocks. Then they put the book to work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={EVE_LAUNCH} target="_blank" rel="noreferrer">
                Launch $STONK
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/bundles">Open the bundle</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/portfolio">Portfolio</Link>
            </Button>
          </div>
        </div>

        <aside className="panel overflow-hidden p-3">
          <div className="flex items-end justify-between px-3 pt-3 pb-2">
            <div>
              <p className="kicker">Active bundle</p>
              <p className="mt-1 font-display text-2xl italic">Keeper book</p>
            </div>
            <Link href="/bundles" className="text-xs text-muted hover:text-fg">
              Full weights →
            </Link>
          </div>
          <BundleMap height={260} />
          <div className="mt-3 grid grid-cols-3 gap-2 px-1 pb-1">
            <SleeveChip label="Equities" value={`${equity}%`} />
            <SleeveChip label="Index" value={`${index}%`} />
            <SleeveChip label="Cash" value={`${cash}%`} />
          </div>
        </aside>
      </section>

      <TickerTape />

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <p className="kicker">How the loop closes</p>
        <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
          {CHAPTERS.map((c) => (
            <article key={c.title} className="border-t border-border pt-6">
              <h2 className="font-display text-3xl italic tracking-tight">{c.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <Pulse label="USDC routed" value={compactUsd(pulse.usdcRouted)} hint="Preview tape" />
          <Pulse label="Stocks bought" value={compactUsd(pulse.stocksBoughtUsd)} hint="At mark" />
          <Pulse label="Holders" value={pulse.holders.toLocaleString()} hint="Eligible supply" />
          <Pulse label="Last cycle" value={pulse.lastCycle} hint="Keeper clock" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Inside the bundle</p>
            <h2 className="display-md mt-2">What the keeper buys.</h2>
          </div>
          <Link href="/bundles" className="hidden text-sm text-muted hover:text-fg sm:inline">
            All {STOCKS.length} names →
          </Link>
        </div>
        <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {STOCKS.slice(0, 8).map((s) => (
            <li key={s.ticker} className="flex items-center gap-4 border-b border-border py-3">
              <span className="w-16 font-mono text-sm font-medium">{s.ticker}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted">{s.name}</span>
              <span className="num text-sm text-accent">{s.weight}%</span>
            </li>
          ))}
        </ul>
        <Link href="/bundles" className="mt-6 inline-flex text-sm text-muted hover:text-fg sm:hidden">
          All {STOCKS.length} names →
        </Link>
      </section>
    </div>
  );
}

function SleeveChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-elevated px-3 py-2.5">
      <p className="kicker">{label}</p>
      <p className="num mt-1 text-sm text-fg">{value}</p>
    </div>
  );
}

function Pulse({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-bg px-5 py-6 sm:px-6">
      <p className="kicker">{label}</p>
      <p className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}
