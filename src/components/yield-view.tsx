"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MARKETS, VENUE_META, type Venue, type Market } from "@/lib/markets";
import { useFolio } from "@/lib/folio";
import { compactQty, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FarmSheet } from "./farm-sheet";
import { StockMark, markFor } from "./stock-mark";
import { Input } from "./ui/input";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const FILTERS: { id: "all" | "apr" | Venue; label: string }[] = [
  { id: "all", label: "All" },
  { id: "apr", label: "High APR" },
  { id: "morpho", label: "Morpho" },
  { id: "aave", label: "Aave" },
  { id: "uniswap", label: "Uniswap" },
];

export function YieldView() {
  const { positions } = useFolio();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<Market | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return MARKETS.filter((m) => {
      if (query && !`${m.name} ${m.ticker} ${m.token} ${m.venue}`.toLowerCase().includes(query)) return false;
      if (filter === "apr") return m.apr >= 15;
      if (filter === "morpho" || filter === "aave" || filter === "uniswap") return m.venue === filter;
      return true;
    })
      .slice()
      .sort((a, b) => b.apr - a.apr);
  }, [filter, q]);

  const chart = useMemo(
    () =>
      [...MARKETS]
        .sort((a, b) => b.apr - a.apr)
        .slice(0, 8)
        .map((m) => ({ name: m.token, apr: m.apr })),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Venues on Arc</p>
          <h1 className="display-md mt-3">Put the book to work.</h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {MARKETS.length} markets · Morpho · Aave V4 · Uniswap on Arc. You farm the stocks bought with the 20% keeper slice. The 70% holder fee is USDC on Portfolio, not here.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="h-11 rounded-md px-4 text-sm text-muted opacity-70 shadow-[var(--shadow-border)]"
        >
          Request a market
        </button>
      </div>

      <div className="panel mt-8 overflow-hidden p-4 sm:p-5">
        <p className="kicker">APR ladder · %</p>
        <div className="mt-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={28}
                domain={[0, 60]}
                tick={{ fill: "var(--color-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in oklab, var(--color-fg) 6%, transparent)" }}
                contentStyle={{
                  background: "var(--color-elevated)",
                  border: "none",
                  boxShadow: "var(--shadow-border)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                  fontSize: 12,
                }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "APR"]}
              />
              <Bar dataKey="apr" fill="#2b6cff" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search markets…"
            className="h-11 rounded-md border-border bg-surface pl-10 text-fg"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              data-filter={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-11 rounded-md px-3 text-xs font-medium tracking-wide uppercase",
                filter === f.id ? "bg-accent text-accent-fg" : "text-muted shadow-[var(--shadow-border)] hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 flex flex-col divide-y divide-border md:hidden">
        {rows.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setOpen(m)} className="flex w-full items-center gap-3 py-3.5 text-left">
              <StockMark stock={markFor(m.ticker)} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.name}</span>
                <span className="block text-xs text-muted">{VENUE_META[m.venue].label}</span>
              </span>
              <span className="num text-sm font-medium text-accent">{pct(m.apr, 1)}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] tracking-[0.14em] text-muted uppercase">
              <th className="pb-3 font-medium">Market</th>
              <th className="pb-3 font-medium">Venue</th>
              <th className="pb-3 font-medium">APR</th>
              <th className="pb-3 font-medium">24h vol</th>
              <th className="pb-3 font-medium">Util</th>
              <th className="pb-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const stock = markFor(m.ticker);
              const staked = positions[m.id];
              return (
                <tr
                  key={m.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-elevated/60"
                  onClick={() => setOpen(m)}
                >
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-3">
                      <StockMark stock={stock} size={36} />
                      <span>
                        <span className="block font-medium">{m.name}</span>
                        <span className="block font-mono text-xs text-muted">{m.token}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 text-muted">{VENUE_META[m.venue].label}</td>
                  <td className="num py-3.5 font-medium text-accent">{pct(m.apr, 1)}</td>
                  <td className="num py-3.5 text-muted">{compactQty(m.vol24h)}</td>
                  <td className="py-3.5">
                    <span className="num text-sm">{m.utilization}%</span>
                    <span className="mt-1 block h-1 w-20 overflow-hidden rounded-full bg-elevated">
                      <span className="block h-full bg-accent" style={{ width: `${m.utilization}%` }} />
                    </span>
                  </td>
                  <td className="py-3.5 text-right text-xs text-muted">
                    {staked && staked > 0 ? `Yours ${staked.toFixed(4)}` : "Queued · Sep 16"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? <p className="py-16 text-center text-sm text-muted">No markets match that filter.</p> : null}

      <FarmSheet market={open} onClose={() => setOpen(null)} />
    </div>
  );
}
