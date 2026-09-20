"use client";

import Link from "next/link";
import { ARC_EXPLORER, TOKEN } from "@/lib/chain";
import { dash, qty, shortAddr, usd } from "@/lib/format";
import { useFolio } from "@/lib/folio";
import { STOCKS, stockByTicker } from "@/lib/stocks";
import { StockMark } from "./stock-mark";

export function DistributionsView() {
  const { seeing, stonk, sharePct, stocksEarnedUsd, history, earned, connected, preview } = useFolio();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-[13px] tracking-[0.18em] text-[#8a8a8a] uppercase">/ Portfolio /</p>
      <h1 className="display mt-3 text-[42px] text-[#111] sm:text-6xl">My distributions.</h1>
      <p className="mt-4 max-w-xl text-[15px] text-[#6b6b6b]">
        {preview
          ? "Preview tape. Sample holder, not your wallet."
          : connected
            ? "Wallet on Arc. Distributions from the keeper book."
            : "Connect a wallet or flip on the preview tape."}
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <Metric
          n="01"
          label="Balance"
          value={dash(seeing, `${(stonk / 1_000_000).toFixed(2)}M $${TOKEN.symbol}`)}
          hint={seeing ? `Eligible $${TOKEN.symbol} in this wallet.` : "Connect to read your balance."}
        />
        <Metric n="02" label="My share" value={dash(seeing, `${sharePct.toFixed(3)}%`)} hint="of eligible supply" />
        <Metric
          n="03"
          label="Stocks earned"
          value={dash(seeing, usd(stocksEarnedUsd))}
          hint="Current value of the stocks in your wallet."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="folio-shadow rounded-2xl bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-[#111]">Distribution history</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/8 text-[11px] tracking-[0.14em] text-[#8a8a8a] uppercase">
                  <th className="pb-3 font-medium">Received</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Value</th>
                  <th className="pb-3 text-right font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {seeing && history.length ? (
                  history.map((row) => {
                    const s = stockByTicker[row.ticker];
                    return (
                      <tr key={row.id} className="border-b border-black/5 last:border-0">
                        <td className="py-3.5 text-[#111]">{row.received}</td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-2">
                            {s ? <StockMark stock={s} size={22} /> : null}
                            <span className="font-medium">{row.ticker}</span>
                          </span>
                        </td>
                        <td className="py-3.5">{qty(row.amount, 4)}</td>
                        <td className="py-3.5">{s ? usd(row.amount * s.price) : "—"}</td>
                        <td className="py-3.5 text-right">
                          <a
                            className="font-mono text-xs text-[#6b6b6b] underline-offset-2 hover:text-[#111] hover:underline"
                            href={`${ARC_EXPLORER}/tx/${row.tx}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {shortAddr(row.tx)}
                          </a>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="font-semibold text-[#111]">Connect a wallet</p>
                      <p className="mt-1 text-sm text-[#6b6b6b]">
                        Stock distributions to this wallet appear here with transaction links.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="folio-shadow rounded-2xl bg-white p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-[#111]">Supported stocks</h2>
            <Link href="/basket" className="text-xs tracking-[0.12em] text-[#8a8a8a] uppercase hover:text-[#111]">
              Basket
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-black/5">
            {STOCKS.filter((s) => s.kind !== "mmf").map((s) => {
              const amt = earned[s.ticker] ?? 0;
              return (
                <li key={s.ticker} className="flex items-center gap-3 py-3">
                  <StockMark stock={s} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#111]">{s.ticker}</p>
                    <p className="truncate text-xs text-[#8a8a8a]">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#111]">{seeing && amt ? qty(amt, 4) : "—"}</p>
                    <p className="text-xs text-[#8a8a8a]">{usd(s.price)} price</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            href="/yield"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-[#111] text-sm font-semibold text-white"
          >
            Farm these stocks
          </Link>
        </section>
      </div>
    </div>
  );
}

function Metric({
  n,
  label,
  value,
  hint,
}: {
  n: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="folio-shadow flex min-h-[220px] flex-col rounded-2xl bg-white p-6 sm:p-8">
      <p className="kicker">/ {n} / {label}</p>
      <p className="mt-auto pt-10 text-[28px] font-semibold tracking-tight text-[#111] sm:text-[32px]">{value}</p>
      <p className="mt-6 text-sm text-[#6b6b6b]">{hint}</p>
    </article>
  );
}
