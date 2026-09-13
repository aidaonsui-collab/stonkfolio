"use client";

import { Flame, Info, ShieldCheck, Lock } from "lucide-react";
import type { Market } from "@/lib/markets";
import { VENUE_META } from "@/lib/markets";
import { compactQty, pct } from "@/lib/format";
import { StockMark, markFor } from "./stock-mark";
import { cn } from "@/lib/utils";

function utilColor(u: number) {
  if (u >= 70) return "#ff8a3d";
  if (u >= 45) return "#c8f542";
  return "#7cff6b";
}

export function MarketCard({
  market,
  onOpen,
  staked,
}: {
  market: Market;
  onOpen: (m: Market) => void;
  staked?: number;
}) {
  const stock = markFor(market.ticker);
  const venue = VENUE_META[market.venue];
  const bar = utilColor(market.utilization);

  return (
    <button
      type="button"
      onClick={() => onOpen(market)}
      data-market={market.id}
      className="group flex h-full flex-col rounded-2xl border border-[rgba(200,245,66,0.12)] bg-[#0e110e] p-4 text-left transition hover:border-[rgba(200,245,66,0.28)] hover:bg-[#111511]"
    >
      <div className="flex flex-wrap gap-1.5">
        {market.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(200,245,66,0.22)] bg-[#121812] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[#c8f542] uppercase">
            <ShieldCheck className="size-3" /> Verified
            <Info className="size-3 opacity-50" />
          </span>
        ) : null}
        {market.liqLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(200,180,80,0.25)] bg-[#16140e] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[#e6c35a] uppercase">
            <Lock className="size-3" /> Liq locked
            <Info className="size-3 opacity-50" />
          </span>
        ) : null}
      </div>
      {market.special ? (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-[rgba(140,120,255,0.3)] bg-[#14121c] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[#b8a6ff] uppercase">
          Special projects
          <Info className="size-3 opacity-50" />
        </span>
      ) : null}

      <div className="mt-4 flex items-start gap-3">
        <StockMark stock={stock} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#c8f542]">APR {pct(market.apr, 1)}</span>
            {market.hot ? <Flame className="size-3.5 text-[#ff8a3d]" /> : null}
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-[#9aa392]">
              ARC
            </span>
          </div>
          <p className="mt-1 truncate text-[15px] font-medium text-[#eef6e6]">{market.name}</p>
        </div>
      </div>

      <p
        className="mt-3 text-[34px] leading-none font-semibold tracking-tight"
        style={{ color: market.tokenColor }}
      >
        {market.token}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-[#6d7666] uppercase">Price / share</p>
          <p className="mt-1 text-lg font-semibold text-[#eef6e6]">
            {market.pricePer >= 10 ? market.pricePer.toFixed(0) : market.pricePer.toFixed(2)}
            <span className="ml-1 text-[11px] font-medium text-[#6d7666]">{market.priceUnit}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.14em] text-[#6d7666] uppercase">24h vol</p>
          <p className="mt-1 text-lg font-semibold text-[#eef6e6]">
            {compactQty(market.vol24h)}
            <span className="ml-1 text-[11px] font-medium text-[#6d7666]">{market.priceUnit}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="tracking-[0.14em] text-[#6d7666] uppercase">Utilization</span>
          <span className="text-[#9aa392]">
            {market.utilNum.toLocaleString()} / {market.utilDen.toLocaleString()}{" "}
            <span className="font-semibold" style={{ color: bar }}>
              {market.utilization}%
            </span>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full" style={{ width: `${market.utilization}%`, background: bar }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[12px]">
        <span className="tracking-[0.12em] text-[#6d7666] uppercase">Token supply</span>
        <span className="font-medium text-[#d8c4ff]">
          {compactQty(market.supply)} {market.token}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="inline-flex items-center gap-1 tracking-[0.12em] text-[#ff8a3d] uppercase">
          <Flame className="size-3" /> Fees to folio
        </span>
        <span className="font-medium text-[#ff8a3d]">
          {compactQty(market.feesToFolio)} {market.priceUnit}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6d7666]">
        <span>{venue.label}</span>
        <span className={cn(market.status === "live" ? "text-[#c8f542]" : "text-[#9aa392]")}>
          {staked && staked > 0 ? `Your stake ${staked.toFixed(4)}` : "Queued · Sept 16"}
        </span>
      </div>
    </button>
  );
}

export function MarketRow({
  market,
  onOpen,
  staked,
}: {
  market: Market;
  onOpen: (m: Market) => void;
  staked?: number;
}) {
  const stock = markFor(market.ticker);
  const bar = utilColor(market.utilization);
  return (
    <button
      type="button"
      onClick={() => onOpen(market)}
      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-[rgba(200,245,66,0.1)] bg-[#0e110e] px-3 py-3 text-left hover:border-[rgba(200,245,66,0.25)] sm:grid-cols-[1.4fr_0.7fr_0.7fr_0.6fr_0.8fr]"
    >
      <div className="flex items-center gap-3">
        <StockMark stock={stock} size={36} />
        <div>
          <p className="text-sm font-medium text-[#eef6e6]">{market.name}</p>
          <p className="text-[11px] text-[#6d7666]">
            {VENUE_META[market.venue].label} · {market.token}
          </p>
        </div>
      </div>
      <p className="text-right font-semibold text-[#c8f542] sm:text-left">APR {pct(market.apr, 1)}</p>
      <p className="hidden text-[#9aa392] sm:block">{compactQty(market.vol24h)} vol</p>
      <p className="hidden font-medium sm:block" style={{ color: bar }}>
        {market.utilization}%
      </p>
      <p className="hidden text-right text-[12px] text-[#9aa392] sm:block">
        {staked && staked > 0 ? `Yours ${staked.toFixed(4)}` : "Queued"}
      </p>
    </button>
  );
}
