"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { ARC_TX_EXPLORER, collateralLabel, MIN_BORROW_LIQUIDITY } from "@/lib/borrow";
import { closeLoan, listBorrowMarkets, listLoans, quoteCloseLoan, type Loan, type MarketInfo } from "@/lib/borrow-client";
import { compactQty, pct, qty } from "@/lib/format";
import { BorrowSheet } from "./borrow-sheet";

const free = (m: MarketInfo) => Number(m.liquidity?.amount ?? 0);

export function BorrowMarkets() {
  const [markets, setMarkets] = useState<MarketInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<MarketInfo | null>(null);
  const [loansKey, setLoansKey] = useState(0);

  useEffect(() => {
    let live = true;
    listBorrowMarkets()
      .then((m) => {
        if (live) setMarkets(m);
      })
      .catch((err) => {
        if (live) setError(err instanceof Error ? err.message : "Borrow Kit request failed");
      });
    return () => {
      live = false;
    };
  }, []);

  const rows = markets ?? [];
  return (
    <section className="mt-10">
      <div>
        <p className="kicker">Circle Borrow Kit · Morpho on Arc</p>
        <h2 className="display-md mt-2">Borrow USDC.</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Borrow USDC or EURC against BTC, ETH, or gold without selling. The loan is yours, opened from your wallet on Morpho Blue. A market with
          no free liquidity cannot lend until borrowers repay.
        </p>
      </div>

      {!markets && !error ? <p className="mt-6 text-sm text-muted">Loading Borrow Kit markets…</p> : null}
      {error ? <p className="mt-6 text-sm text-down">{error}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.14em] text-muted uppercase">
                <th className="pb-3 font-medium">Collateral</th>
                <th className="pb-3 font-medium">Borrow</th>
                <th className="pb-3 font-medium">APY</th>
                <th className="pb-3 font-medium">Liquidates at</th>
                <th className="pb-3 text-right font-medium">Free to borrow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const full = free(m) < MIN_BORROW_LIQUIDITY;
                return (
                  <tr
                    key={m.marketId}
                    className={full ? "border-b border-border last:border-0 opacity-60" : "cursor-pointer border-b border-border last:border-0 hover:bg-elevated/60"}
                    onClick={() => {
                      if (!full) setOpen(m);
                    }}
                  >
                    <td className="py-3.5">
                      <span className="block font-medium">{m.collateralAsset.symbol}</span>
                      {collateralLabel(m.collateralAsset.symbol) ? (
                        <span className="block text-xs text-muted">{collateralLabel(m.collateralAsset.symbol)}</span>
                      ) : null}
                    </td>
                    <td className="py-3.5">{m.loanAsset.symbol}</td>
                    <td className="num py-3.5 font-medium text-accent">{m.borrowApy !== null ? pct(m.borrowApy * 100, 2) : "—"}</td>
                    <td className="num py-3.5 text-muted">{m.lltv !== null ? `${pct(m.lltv * 100, 0)} LTV` : "—"}</td>
                    <td className="num py-3.5 text-right">{full ? <span className="text-muted">Full</span> : `${compactQty(free(m))} ${m.loanAsset.symbol}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <ul className="mt-6 flex flex-col divide-y divide-border md:hidden">
        {rows.map((m) => {
          const full = free(m) < MIN_BORROW_LIQUIDITY;
          return (
            <li key={m.marketId}>
              <button type="button" disabled={full} onClick={() => setOpen(m)} className="flex w-full items-center gap-3 py-3.5 text-left disabled:opacity-60">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {m.collateralAsset.symbol} → {m.loanAsset.symbol}
                  </span>
                  <span className="block text-xs text-muted">{full ? "Full" : `${compactQty(free(m))} ${m.loanAsset.symbol} free`}</span>
                </span>
                <span className="num text-sm font-medium text-accent">{m.borrowApy !== null ? pct(m.borrowApy * 100, 2) : "—"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {markets ? (
        <p className="mt-3 text-xs text-muted">
          {rows.filter((m) => free(m) >= MIN_BORROW_LIQUIDITY).length} of {rows.length} markets have liquidity to lend. Rates and liquidity are
          Borrow Kit snapshots; the borrow prices again when you sign.
        </p>
      ) : null}

      <YourLoans refreshKey={loansKey} markets={rows} />
      <BorrowSheet market={open} onClose={() => setOpen(null)} onBorrowed={() => setLoansKey((k) => k + 1)} />
    </section>
  );
}

function YourLoans({ refreshKey, markets }: { refreshKey: number; markets: MarketInfo[] }) {
  const { address, isConnected, chainId, connector } = useAccount();
  const onArc = isConnected && chainId === ARC_CHAIN_ID;
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ loanId: string; text: string; url?: string } | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      setLoans(await listLoans(address));
    } catch {
      setLoans([]);
    }
  }, [address]);

  useEffect(() => {
    if (!address || !onArc) return;
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [address, onArc, load, refreshKey]);

  if (!address || !onArc || !loans || loans.length === 0) return null;

  async function close(loan: Loan) {
    if (!connector) return;
    setBusy(loan.loanId);
    setNote(null);
    try {
      const q = await quoteCloseLoan(loan.loanId);
      setNote({ loanId: loan.loanId, text: `Repays ${qty(Number(q.bundledRepayment.amount), 2)} ${q.bundledRepayment.token}. Confirm in your wallet…` });
      const res = await closeLoan(connector, loan.loanId);
      setNote({
        loanId: loan.loanId,
        text: res.status === "submitted" ? "Close submitted." : "Loan closed. Collateral returned.",
        url: "txHash" in res && res.txHash ? `${ARC_TX_EXPLORER}${res.txHash}` : undefined,
      });
      await load();
    } catch (err) {
      setNote({ loanId: loan.loanId, text: err instanceof Error ? err.message : "Close failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8">
      <p className="kicker">Your loans</p>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {loans.map((l) => {
          const m = markets.find((x) => x.marketId === l.marketId);
          const pending = l.dataStatus === "PENDING";
          return (
            <li key={l.loanId} className="flex flex-wrap items-center gap-3 py-3.5 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {m ? `${m.collateralAsset.symbol} → ${m.loanAsset.symbol}` : "Loan"}
                  {pending ? <span className="ml-2 text-xs text-muted">indexing…</span> : null}
                </span>
                {!pending ? (
                  <span className="block text-xs text-muted">
                    Owes {l.borrowed ? `${qty(Number(l.borrowed.amount), 2)} ${l.borrowed.token}` : "—"} · collateral{" "}
                    {l.collateral ? `${qty(Number(l.collateral.amount), 6)} ${l.collateral.token}` : "—"} · health{" "}
                    {l.healthFactor !== null ? l.healthFactor.toFixed(2) : "no debt"}
                  </span>
                ) : null}
                {note?.loanId === l.loanId ? (
                  <span className="mt-1 block text-xs text-accent">
                    {note.text}
                    {note.url ? (
                      <a href={note.url} target="_blank" rel="noreferrer" className="ml-1 underline">
                        View tx
                      </a>
                    ) : null}
                  </span>
                ) : null}
              </span>
              <Button variant="outline" size="sm" disabled={pending || busy !== null} onClick={() => close(l)}>
                {busy === l.loanId ? "Closing…" : "Repay & close"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
