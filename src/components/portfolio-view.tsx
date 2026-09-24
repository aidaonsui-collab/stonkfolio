"use client";

import Link from "next/link";
import { ARC_EXPLORER, TOKEN } from "@/lib/chain";
import { LAUNCH, pctOfFee } from "@/lib/fees";
import { dash, qty, shortAddr, usd } from "@/lib/format";
import { useFolio } from "@/lib/folio";
import { STOCKS, stockByTicker } from "@/lib/stocks";
import { Button } from "./ui/button";
import { StockMark } from "./stock-mark";
import { ConnectButton } from "./connect-button";
import { RewardChoice } from "./reward-choice";

export function PortfolioView() {
  const { seeing, stonk, sharePct, stocksEarnedUsd, history, earned, connected, preview, setPreview } = useFolio();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">Holder desk</p>
      <h1 className="display-md mt-3">Your folio.</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        {preview
          ? "Preview tape. Sample holder, not your wallet."
          : connected
            ? `Desk is open. Stocks from the ${pctOfFee(LAUNCH.split.creatorBps)} rewards.`
            : "Connect a desk or flip on the preview tape to read balances and the stock ledger."}
      </p>
      {!seeing ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <ConnectButton />
          <Button variant="outline" onClick={() => setPreview(true)}>
            Preview tape
          </Button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
        <Metric
          label="Balance"
          value={dash(seeing, `${(stonk / 1_000_000).toFixed(2)}M $${TOKEN.symbol}`)}
          hint={seeing ? `Eligible $${TOKEN.symbol} in this wallet.` : "Connect to read your balance."}
        />
        <Metric label="Your share" value={dash(seeing, `${sharePct.toFixed(3)}%`)} hint="of eligible supply" />
        <Metric
          label="Stocks earned"
          value={dash(seeing, usd(stocksEarnedUsd))}
          hint={`${pctOfFee(LAUNCH.split.creatorBps)} rewards, bought as dShares.`}
        />
      </div>

      <RewardChoice />

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="min-w-0">
          <h2 className="font-display text-2xl italic tracking-tight">Ledger</h2>
          {seeing && history.length ? (
            <>
              <ul className="mt-4 divide-y divide-border md:hidden">
                {history.map((row) => {
                  const s = stockByTicker[row.ticker];
                  return (
                    <li key={row.id} className="flex items-center gap-3 py-3.5">
                      {s ? <StockMark stock={s} size={32} /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{row.ticker}</p>
                        <p className="font-mono text-xs text-muted">{row.received}</p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm">{qty(row.amount, 4)}</p>
                        <p className="num text-xs text-muted">{s ? usd(row.amount * s.price) : "—"}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[11px] tracking-[0.14em] text-muted uppercase">
                      <th className="pb-3 font-medium">Received</th>
                      <th className="pb-3 font-medium">Stock</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Value</th>
                      <th className="pb-3 text-right font-medium">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => {
                      const s = stockByTicker[row.ticker];
                      return (
                        <tr key={row.id} className="border-b border-border last:border-0">
                          <td className="py-3.5 font-mono text-xs">{row.received}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-2">
                              {s ? <StockMark stock={s} size={22} /> : null}
                              <span className="font-medium">{row.ticker}</span>
                            </span>
                          </td>
                          <td className="num py-3.5">{qty(row.amount, 4)}</td>
                          <td className="num py-3.5">{s ? usd(row.amount * s.price) : "—"}</td>
                          <td className="py-3.5 text-right">
                            <a
                              className="font-mono text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
                              href={`${ARC_EXPLORER}/tx/${row.tx}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {shortAddr(row.tx)}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-2xl italic">The desk is empty.</p>
              <p className="mt-2 text-sm text-muted">Stock distributions appear here with transaction links.</p>
            </div>
          )}
        </section>

        <section className="panel min-w-0 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl italic tracking-tight">Holdings</h2>
            <Link href="/bundles" className="kicker hover:text-fg">
              Bundle
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {STOCKS.filter((s) => s.kind !== "mmf").map((s) => {
              const amt = earned[s.ticker] ?? 0;
              return (
                <li key={s.ticker} className="flex items-center gap-3 py-3">
                  <StockMark stock={s} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.ticker}</p>
                    <p className="truncate text-xs text-muted">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="num font-medium">{seeing && amt ? qty(amt, 4) : "—"}</p>
                    <p className="num text-xs text-muted">{usd(s.price)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button asChild className="mt-4 w-full" variant="accent">
            <Link href="/yield">Farm these stocks</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="bg-surface px-5 py-6 sm:px-6 sm:py-8">
      <p className="kicker">{label}</p>
      <p className="mt-8 font-display text-3xl tracking-tight">{value}</p>
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </article>
  );
}
