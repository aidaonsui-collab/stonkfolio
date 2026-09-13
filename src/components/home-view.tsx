"use client";

import Link from "next/link";
import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";
import { STOCKS } from "@/lib/stocks";
import { StockMark } from "./stock-mark";

export function HomeView() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-[13px] tracking-[0.18em] text-[#8a8a8a] uppercase">Arc · eve.fun Instant</p>
      <h1 className="display mt-4 max-w-3xl text-[44px] text-[#111] sm:text-7xl">
        Creator fees.
        <br />
        Real stocks.
      </h1>
      <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#5c5c5c]">
        $STONK launches on eve.fun. The Instant creator USDC — 50% of the 1% quote-side fee — auto-buys a book you pick from whatever tokenized names Arc lists after September 16. Holders get those stocks. Then they farm them on Morpho, Aave, and Uniswap.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={EVE_LAUNCH}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center rounded-xl bg-[#111] px-5 text-sm font-semibold text-white"
        >
          Launch $STONK on eve.fun
        </a>
        <Link
          href="/distributions"
          className="inline-flex h-12 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[#111] shadow-sm"
        >
          My distributions
        </Link>
        <Link
          href="/yield"
          className="inline-flex h-12 items-center rounded-xl px-5 text-sm font-semibold text-[#111]"
        >
          Yield board →
        </Link>
      </div>

      <div className="mt-14 grid gap-3 md:grid-cols-3">
        <Step
          n="01"
          title="Launch"
          body={`Instant on eve.fun. 1B ${TOKEN.symbol}, TOKEN/USDC, LP locked. Set the rewards wallet to the Stonkfolio keeper.`}
        />
        <Step
          n="02"
          title="Buy"
          body="A keeper spends creator USDC only on the curated basket — CRCL, NVDA, AAPL, the index sleeve, BUIDL/USYC cash — once those tokens exist on 5042."
        />
        <Step
          n="03"
          title="Farm"
          body="Distributed stocks go to holders. The yield tab is the clutch-style board for Morpho isolated markets, Aave V4, and Uniswap LPs Arc already posted."
        />
      </div>

      <section className="folio-shadow mt-10 rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="kicker">/ Curated book</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">What the keeper buys.</h2>
          </div>
          <Link href="/basket" className="text-sm font-medium text-[#6b6b6b] hover:text-[#111]">
            Full basket →
          </Link>
        </div>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {STOCKS.slice(0, 8).map((s) => (
            <li key={s.ticker} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <StockMark stock={s} size={36} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.ticker}</p>
                <p className="truncate text-xs text-[#8a8a8a]">{s.name}</p>
              </div>
              <p className="text-sm text-[#6b6b6b]">{s.weight}%</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-sm text-[#8a8a8a]">
        Pad:{" "}
        <a className="underline-offset-2 hover:text-[#111] hover:underline" href={EVE_FUN} target="_blank" rel="noreferrer">
          eve.fun
        </a>
        . Settlement: Arc 5042. Gas: USDC.
      </p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="folio-shadow rounded-2xl bg-white p-6 sm:p-8">
      <p className="kicker">/ {n} / {title}</p>
      <p className="mt-8 text-sm leading-relaxed text-[#5c5c5c]">{body}</p>
    </article>
  );
}
