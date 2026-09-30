"use client";

import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "./connect-button";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { ARC_TX_EXPLORER, BORROW_FEE_BPS, collateralLabel, formatBorrowAmount } from "@/lib/borrow";
import { borrowFromMarket, quoteBorrow, type BorrowQuote, type MarketInfo } from "@/lib/borrow-client";
import { pct, qty } from "@/lib/format";

const BAND_TONE: Record<string, string> = {
  SAFE: "text-accent",
  WARN: "text-fg",
  URGENT: "text-down",
  IMMINENT: "text-down",
  LIQUIDATABLE: "text-down",
};

const FEE_LABEL: Record<string, string> = { integrator: "StonkFolio fee", circle: "Circle fee" };

export function BorrowSheet({ market, onClose, onBorrowed }: { market: MarketInfo | null; onClose: () => void; onBorrowed: () => void }) {
  return (
    <Sheet
      open={Boolean(market)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="border-border bg-surface text-fg data-[side=right]:sm:max-w-[420px] sm:max-w-[420px]">
        {market ? <BorrowSheetBody key={market.marketId} market={market} onBorrowed={onBorrowed} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function BorrowSheetBody({ market, onBorrowed }: { market: MarketInfo; onBorrowed: () => void }) {
  const { address, isConnected, chainId, connector } = useAccount();
  const onArc = isConnected && chainId === ARC_CHAIN_ID;
  const collateral = market.collateralAsset;
  const loan = market.loanAsset;
  const available = Number(market.liquidity?.amount ?? 0);

  const { data: collateralRaw } = useReadContract({
    address: collateral.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address && onArc) },
  });
  const collateralHave = collateralRaw !== undefined ? Number(formatUnits(collateralRaw, collateral.decimals)) : null;

  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<BorrowQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "done">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);

  // Re-price 500ms after typing stops. A quote is a preview; nothing is signed.
  useEffect(() => {
    if (!address || !onArc || !amount.trim()) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const n = Number(formatBorrowAmount(amount));
        if (n > available) throw new Error(`Only ${qty(available, 2)} ${loan.symbol} is free to borrow in this market.`);
        const q = await quoteBorrow(market.marketId, address, amount);
        if (live) {
          setQuote(q);
          setQuoteError(null);
        }
      } catch (err) {
        if (live) {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : "No quote.");
        }
      }
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [amount, address, onArc, available, loan.symbol, market.marketId]);

  const needCollateral = quote ? Number(quote.collateralAmount.amount) : null;
  const short = needCollateral !== null && collateralHave !== null && needCollateral > collateralHave;

  async function submit() {
    if (!connector || !quote || short) return;
    setStatus("pending");
    setMsg("Confirm in your wallet…");
    setTxUrl(null);
    try {
      const res = await borrowFromMarket(connector, market.marketId, amount);
      setStatus("done");
      if (res.status === "confirmed") {
        setMsg(`Borrowed ${res.amountBorrowed.amount} ${res.amountBorrowed.token}.`);
        setTxUrl(`${ARC_TX_EXPLORER}${res.txHash}`);
      } else {
        setMsg("Submitted. It shows under Your loans once indexed.");
      }
      setAmount("");
      setQuote(null);
      onBorrowed();
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Borrow failed.");
    }
  }

  const label = collateralLabel(collateral.symbol);
  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-fg">
          Borrow {loan.symbol} against {collateral.symbol}
          <span className="mt-0.5 block text-xs font-normal tracking-normal text-muted">
            {label ? `${label} · ` : ""}Morpho Blue · Circle Borrow Kit
          </span>
        </SheetTitle>
        <SheetDescription className="text-muted">
          {market.borrowApy !== null ? `${pct(market.borrowApy * 100, 2)} borrow APY` : "APY pending"}
          {market.lltv !== null ? ` · liquidates at ${pct(market.lltv * 100, 0)} LTV` : ""} · {qty(available, 2)} {loan.symbol} free.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 px-5 pb-8">
        {!isConnected || !onArc ? (
          <div className="flex flex-col items-start gap-3 rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">Connect a wallet on Arc to borrow.</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
              <p className="kicker">{collateral.symbol} in wallet</p>
              <p className="mt-1 font-medium">{collateralHave === null ? "—" : `${qty(collateralHave, 6)} ${collateral.symbol}`}</p>
            </div>

            <label className="block">
              <span className="kicker">Borrow · {loan.symbol}</span>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setMsg(null);
                  setStatus("idle");
                  if (!e.target.value.trim()) {
                    setQuote(null);
                    setQuoteError(null);
                  }
                }}
                placeholder="0.00"
                disabled={available < 1}
                className="num mt-2 h-11 border-border bg-bg text-fg"
              />
            </label>

            {quoteError ? <p className="text-xs text-down">{quoteError}</p> : null}
            {quote ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-elevated p-3 text-sm shadow-[var(--shadow-border)]">
                <dt className="text-muted">Collateral posted</dt>
                <dd className="num text-right">
                  {qty(Number(quote.collateralAmount.amount), 6)} {quote.collateralAmount.token}
                </dd>
                <dt className="text-muted">You receive</dt>
                <dd className="num text-right">
                  {qty(Number(quote.loanAssetAmount.amount), 2)} {quote.loanAssetAmount.token}
                </dd>
                <dt className="text-muted">Health factor</dt>
                <dd className={`num text-right ${BAND_TONE[quote.resultingBand] ?? "text-fg"}`}>
                  {quote.resultingHealthFactor !== null ? quote.resultingHealthFactor.toFixed(2) : "—"} · {quote.resultingBand.toLowerCase()}
                </dd>
                <dt className="text-muted">Liquidation price</dt>
                <dd className="num text-right">
                  {quote.liquidationPrice
                    ? `${qty(Number(quote.liquidationPrice.amount), Number(quote.liquidationPrice.amount) < 10 ? 4 : 2)} ${quote.liquidationPrice.token} per ${collateral.symbol}`
                    : "—"}
                </dd>
                {quote.fees.map((f, i) => (
                  <FeeRow key={i} label={FEE_LABEL[f.type] ?? f.type} amount={f.amount.amount} token={f.amount.token} />
                ))}
              </dl>
            ) : null}
            {short ? <p className="text-xs text-down">Not enough {collateral.symbol} in this wallet for that amount.</p> : null}

            <Button variant="accent" onClick={submit} disabled={!quote || short || status === "pending"}>
              {status === "pending" ? "Confirming…" : `Borrow ${loan.symbol}`}
            </Button>
            {msg ? (
              <p className={`text-xs ${status === "error" ? "text-down" : "text-accent"}`}>
                {msg}
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="ml-1 underline">
                    View tx
                  </a>
                ) : null}
              </p>
            ) : null}
          </>
        )}
        <p className="text-xs leading-relaxed text-muted">
          Loans are opened directly on Morpho Blue through Circle Borrow Kit, from your own wallet. Circle is not the lender. If the health
          factor falls below 1, the collateral can be liquidated. StonkFolio adds a {BORROW_FEE_BPS / 100}% origination fee.
        </p>
      </div>
    </>
  );
}

function FeeRow({ label, amount, token }: { label: string; amount: string; token: string }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="num text-right">
        {qty(Number(amount), 4)} {token}
      </dd>
    </>
  );
}
