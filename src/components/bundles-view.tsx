"use client";

import { STOCKS, SLEEVES, SLEEVE_TONE, sleeveWeight } from "@/lib/stocks";
import { usd } from "@/lib/format";
import { BundleMap } from "./bundle-map";
import { StockMark } from "./stock-mark";
import { DinariStatus } from "./dinari-status";
import { WeightBar } from "./page-hero";
import { cn } from "@/lib/utils";

export function BundlesView() {
  const total = STOCKS.reduce((s, x) => s + x.weight, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">The keeper book</p>
      <h1 className="display-md mt-3">The bundle.</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        The keeper buys these names with fee USDC. 5% of the book stays in USYC and BUIDL.
      </p>

      <DinariStatus />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {SLEEVES.map((s) => (
          <div key={s.id} className="panel-tight relative overflow-hidden p-5">
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: SLEEVE_TONE[s.id] }} />
            <p className="kicker">{s.label}</p>
            <p className="num mt-3 font-display text-3xl">{sleeveWeight(s.id)}%</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <WeightBar
          parts={SLEEVES.map((s) => ({
            key: s.id,
            label: s.label,
            value: sleeveWeight(s.id),
          }))}
        />
      </div>

      <div className="panel mt-6 overflow-hidden p-3">
        <div className="flex items-end justify-between px-3 pt-2 pb-3">
          <p className="kicker">Packed by weight</p>
          <p className="text-xs text-muted">Sums to {total}%</p>
        </div>
        <BundleMap height={340} />
      </div>

      <div className="mt-8">
        <div className="hidden grid-cols-[1.4fr_0.6fr_1fr_0.5fr_0.7fr_0.6fr] border-b border-border px-2 pb-2 text-[11px] tracking-[0.14em] text-muted uppercase md:grid">
          <span>Name</span>
          <span>Kind</span>
          <span>Issuer</span>
          <span>Weight</span>
          <span>Mark</span>
          <span>Status</span>
        </div>
        <ul>
          {STOCKS.map((s) => (
            <li
              key={s.ticker}
              className="grid items-center gap-2 border-b border-border py-3.5 md:grid-cols-[1.4fr_0.6fr_1fr_0.5fr_0.7fr_0.6fr]"
            >
              <span className="flex items-center gap-3">
                <StockMark stock={s} size={36} />
                <span>
                  <span className="block font-medium">{s.ticker}</span>
                  <span className="block max-w-[220px] truncate text-xs text-muted">{s.name}</span>
                </span>
              </span>
              <span className="hidden capitalize text-muted md:block">{s.kind === "mmf" ? "cash" : s.kind}</span>
              <span className="hidden truncate text-sm text-muted md:block">{s.issuer}</span>
              <span className="num text-sm">
                <span className="text-muted md:hidden">Weight </span>
                {s.weight}%
              </span>
              <span className="num hidden text-sm md:block">{usd(s.price)}</span>
              <span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase",
                    s.status === "candidate" ? "bg-elevated text-muted" : "bg-up/15 text-up",
                  )}
                >
                  {s.status}
                </span>
              </span>
              <div className="col-span-full h-1 overflow-hidden rounded-full bg-elevated md:col-span-6">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.weight * (100 / 16)}%`, background: SLEEVE_TONE[s.kind] }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Weights sum to {total}%.</p>
      </div>
    </div>
  );
}
