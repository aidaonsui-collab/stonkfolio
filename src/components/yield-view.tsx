"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Search, ShieldCheck, Flame } from "lucide-react";
import { MARKETS, type Venue } from "@/lib/markets";
import { useFolio } from "@/lib/folio";
import { MarketCard, MarketRow } from "./market-card";
import { FarmSheet } from "./farm-sheet";
import type { Market } from "@/lib/markets";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | "verified" | "apr" | "hot" | Venue; label: string }[] = [
  { id: "all", label: "All" },
  { id: "verified", label: "Verified" },
  { id: "apr", label: "High APR" },
  { id: "hot", label: "Hot" },
  { id: "morpho", label: "Morpho" },
  { id: "aave", label: "Aave" },
  { id: "uniswap", label: "Uniswap" },
];

export function YieldView() {
  const { positions } = useFolio();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [grid, setGrid] = useState(true);
  const [open, setOpen] = useState<Market | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return MARKETS.filter((m) => {
      if (query && !`${m.name} ${m.ticker} ${m.token} ${m.venue}`.toLowerCase().includes(query)) return false;
      if (filter === "verified") return m.verified;
      if (filter === "apr") return m.apr >= 15;
      if (filter === "hot") return m.hot;
      if (filter === "morpho" || filter === "aave" || filter === "uniswap") return m.venue === filter;
      return true;
    });
  }, [filter, q]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6">
      <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-tight text-[#eef6e6] sm:text-4xl">Explore Markets</h1>
          <p className="mt-1 text-sm text-[#8a9480]">
            {MARKETS.length} markets · tokenized stock liquidity on Arc · Morpho · Aave V4 · Uniswap
          </p>
        </div>
        <button
          type="button"
          disabled
          className="h-10 rounded-xl border border-[rgba(200,245,66,0.25)] px-4 text-sm font-medium text-[#c8f542] opacity-80"
        >
          + Request a market
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6d7666]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search markets…"
            className="h-11 w-full rounded-xl border border-white/8 bg-[#0e110e] pr-3 pl-10 text-sm text-[#eef6e6] outline-none placeholder:text-[#6d7666] focus:border-[rgba(200,245,66,0.35)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              data-filter={f.id}
              className={cn(
                "inline-flex h-11 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium",
                filter === f.id
                  ? "border-[rgba(200,245,66,0.35)] bg-[#141a12] text-[#c8f542]"
                  : "border-white/8 bg-[#0e110e] text-[#9aa392] hover:text-[#eef6e6]",
              )}
            >
              {f.id === "verified" ? <ShieldCheck className="size-3.5" /> : null}
              {f.id === "apr" || f.id === "hot" ? <Flame className="size-3.5" /> : null}
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex rounded-xl border border-white/8 bg-[#0e110e] p-1">
          <button
            type="button"
            onClick={() => setGrid(true)}
            className={cn("rounded-lg px-3 py-2 text-[#9aa392]", grid && "bg-[#141a12] text-[#c8f542]")}
            aria-label="Grid"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setGrid(false)}
            className={cn("rounded-lg px-3 py-2 text-[#9aa392]", !grid && "bg-[#141a12] text-[#c8f542]")}
            aria-label="List"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {grid ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((m) => (
            <MarketCard key={m.id} market={m} onOpen={setOpen} staked={positions[m.id]} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {rows.map((m) => (
            <MarketRow key={m.id} market={m} onOpen={setOpen} staked={positions[m.id]} />
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-16 text-center text-sm text-[#8a9480]">No markets match that filter.</p>
      ) : null}

      <FarmSheet market={open} onClose={() => setOpen(null)} />
    </div>
  );
}
