"use client";

import Link from "next/link";
import { FEE_LEGS, LAUNCH, pctOfFee } from "@/lib/fees";
import { compactUsd } from "@/lib/format";
import { useFolio } from "@/lib/folio";
import { protocolPreview, SLEEVE_TONE, SLEEVES, sleeveWeight, STOCKS } from "@/lib/stocks";
import { AddUsdc, AddUsdcButton } from "./add-usdc";
import { Button } from "./ui/button";
import { TickerTape } from "./ticker-tape";
import { WeightBar } from "./page-hero";
import { StockMark } from "./stock-mark";

const CHAPTERS = [
  {
    n: "01",
    title: "Funding.",
    body: `Every trade takes 1%. ${pctOfFee(LAUNCH.split.creatorBps)} of that fee is USDC and goes to the Circle agent wallet — the keeper.`,
  },
  {
    n: "02",
    title: "The buy.",
    body: "Most of that USDC buys the stocks. 5% stays in USYC and BUIDL. Holders get the stocks in the same proportion as their $SFOLIO.",
  },
  {
    n: "03",
    title: "The farm.",
    body: "Holders farm those stocks on Morpho, Aave V4, and Uniswap — or put idle USDC in Circle Earn vaults on Yield.",
  },
];

export function HomeView() {
  const { preview } = useFolio();
  const pulse = protocolPreview();
  const equity = sleeveWeight("equity");
  const index = sleeveWeight("index");
  const iEnd = equity + index;

  return (
    <div>
      <section className="page pb-8 sm:pb-8">
        <AddUsdc>
          <div className="stagger-in flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="display text-fg">
                Your book.
                <span className="block italic text-accent">Your folio.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
                Every trade buys the stocks. Every holder owns them.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/bundles">Open the Book</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/portfolio">Open Folio</Link>
              </Button>
              <AddUsdcButton />
            </div>
          </div>
        </AddUsdc>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
          <p className="kicker">Protocol pulse</p>
          {preview ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 font-mono text-[11px] tracking-wide text-accent">
              Sample data · preview tape
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Keeper USDC"
            value={preview ? compactUsd(pulse.usdcRouted) : "—"}
            hint={preview ? `${pctOfFee(LAUNCH.split.creatorBps)} of the 1% fee` : "Starts when the book lists."}
          />
          <Kpi
            label="Stocks bought"
            value={preview ? compactUsd(pulse.stocksBoughtUsd) : "—"}
            hint={preview ? "At mark" : "Starts when the book lists."}
          />
          <Kpi
            label="Holders"
            value={preview ? pulse.holders.toLocaleString() : "—"}
            hint={preview ? "Eligible supply" : "Starts when the book lists."}
          />
          <Kpi
            label="Last cycle"
            value={preview ? pulse.lastCycle : "—"}
            hint={preview ? "Keeper clock" : "Starts when the book lists."}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="panel p-5 sm:p-6">
            <p className="kicker">Allocation</p>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="relative size-40 shrink-0">
                <div
                  className="size-full rounded-full"
                  style={{
                    background: `conic-gradient(${SLEEVE_TONE.equity} 0 ${equity}%, ${SLEEVE_TONE.index} ${equity}% ${iEnd}%, ${SLEEVE_TONE.mmf} ${iEnd}% 100%)`,
                  }}
                />
                <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-surface">
                  <p className="kicker">Book</p>
                  <p className="font-display text-2xl">100%</p>
                </div>
              </div>
              <ul className="w-full space-y-3">
                {SLEEVES.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: SLEEVE_TONE[s.id] }} />
                      {s.label}
                    </span>
                    <span className="num text-sm">{sleeveWeight(s.id)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="panel overflow-hidden p-5 sm:p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="kicker">Top of book</p>
                <h2 className="mt-1 font-display text-2xl italic">What the keeper buys.</h2>
              </div>
              <Link href="/bundles" className="text-xs text-accent hover:underline">
                All {STOCKS.length} names
              </Link>
            </div>
            <ul className="mt-4">
              {STOCKS.slice(0, 8).map((s) => (
                <li key={s.ticker} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                  <StockMark stock={s} size={32} />
                  <span className="w-14 font-mono text-sm">{s.ticker}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{s.name}</span>
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
                    <span
                      className="block h-full"
                      style={{
                        width: `${(s.weight / 16) * 100}%`,
                        background: SLEEVE_TONE[s.kind],
                      }}
                    />
                  </span>
                  <span className="num w-10 text-right text-sm">{s.weight}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <TickerTape />

      <section className="page pt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="display-md">Where the cut goes.</h2>
          <p className="max-w-xs text-sm text-muted">
            1% on every trade. {pctOfFee(LAUNCH.split.creatorBps)} rewards. {pctOfFee(LAUNCH.split.platformBps)} platform.
          </p>
        </div>
        <div className="mt-6">
          <WeightBar
            parts={FEE_LEGS.map((leg) => ({
              key: leg.key,
              label: leg.label,
              value: leg.bps / 100,
            }))}
          />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FEE_LEGS.map((leg) => (
            <div key={leg.key} className="panel-tight relative overflow-hidden p-5">
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{
                  background:
                    leg.key === "creator"
                      ? "var(--color-accent)"
                      : leg.key === "burn"
                        ? "var(--color-down)"
                        : leg.key === "autoLp"
                          ? "var(--color-up)"
                          : "var(--color-cash)",
                }}
              />
              <p className="kicker">{leg.label}</p>
              <p className="num mt-3 font-display text-3xl">{pctOfFee(leg.bps)}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{leg.hint}</p>
            </div>
          ))}
        </div>

        <p className="kicker mt-14">How the loop closes</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CHAPTERS.map((c) => (
            <article key={c.title} className="panel-tight p-5">
              <span className="font-mono text-xs tracking-widest text-accent">{c.n}</span>
              <h2 className="font-display mt-3 text-2xl italic tracking-tight">{c.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="panel-tight relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
      <p className="kicker">{label}</p>
      <p className="mt-3 font-display text-2xl tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}
