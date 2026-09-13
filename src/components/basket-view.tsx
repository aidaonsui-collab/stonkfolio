"use client";

import { STOCKS } from "@/lib/stocks";
import { usd } from "@/lib/format";
import { StockMark } from "./stock-mark";

export function BasketView() {
  const total = STOCKS.reduce((s, x) => s + x.weight, 0);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-[13px] tracking-[0.18em] text-[#8a8a8a] uppercase">/ RWA /</p>
      <h1 className="display mt-3 text-[42px] text-[#111] sm:text-6xl">The basket.</h1>
      <p className="mt-4 max-w-2xl text-[15px] text-[#6b6b6b]">
        Creator-chosen. The keeper only buys names on this list, and only after they list on Arc. Weights are the split of Instant creator USDC — not a promise of fill. Change the book when Circle publishes contracts.
      </p>

      <div className="folio-shadow mt-8 overflow-x-auto rounded-2xl bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/8 text-[11px] tracking-[0.14em] text-[#8a8a8a] uppercase">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Kind</th>
              <th className="px-5 py-3 font-medium">Issuer</th>
              <th className="px-5 py-3 font-medium">Weight</th>
              <th className="px-5 py-3 font-medium">Mark</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {STOCKS.map((s) => (
              <tr key={s.ticker} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-3">
                    <StockMark stock={s} size={32} />
                    <span>
                      <span className="block font-semibold">{s.ticker}</span>
                      <span className="block max-w-[220px] truncate text-xs text-[#8a8a8a]">{s.name}</span>
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3.5 capitalize text-[#6b6b6b]">{s.kind}</td>
                <td className="px-5 py-3.5 text-[#6b6b6b]">{s.issuer}</td>
                <td className="px-5 py-3.5 font-medium">{s.weight}%</td>
                <td className="px-5 py-3.5">{usd(s.price, s.price >= 10 ? 2 : 2)}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-[#f4f1ea] px-2 py-0.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 py-4 text-xs text-[#8a8a8a]">Weights sum to {total}%. Nothing is live on 5042 until the issuer token exists.</p>
      </div>
    </div>
  );
}
