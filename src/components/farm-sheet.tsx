"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Market } from "@/lib/markets";
import { VENUE_META } from "@/lib/markets";
import { qty, usd } from "@/lib/format";
import { useFolio } from "@/lib/folio";
import { StockMark, markFor } from "./stock-mark";

export function FarmSheet({
  market,
  onClose,
}: {
  market: Market | null;
  onClose: () => void;
}) {
  const { seeing, available, positions, deposit, withdraw } = useFolio();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"in" | "out">("in");
  const [msg, setMsg] = useState<string | null>(null);

  const stock = market ? markFor(market.ticker) : undefined;
  const have = market ? (available[market.ticker] ?? 0) : 0;
  const staked = market ? (positions[market.id] ?? 0) : 0;
  const n = Number(amount);
  const max = mode === "in" ? have : staked;
  const notional = useMemo(() => {
    if (!market || !Number.isFinite(n)) return 0;
    return n * market.pricePer;
  }, [market, n]);

  function submit() {
    if (!market) return;
    const res = mode === "in" ? deposit(market, n) : withdraw(market, n);
    if (!res.ok) {
      setMsg(res.reason);
      return;
    }
    setMsg(
      mode === "in"
        ? "Position marked on this desk. Fills wait on Arc RWA + venue contracts."
        : "Pulled back to your folio.",
    );
    setAmount("");
  }

  return (
    <Sheet
      open={Boolean(market)}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setMsg(null);
          setAmount("");
        }
      }}
    >
      <SheetContent className="border-border bg-surface text-fg data-[side=right]:sm:max-w-[420px] sm:max-w-[420px]">
        {market ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3 text-fg">
                {stock ? <StockMark stock={stock} size={40} /> : null}
                <span>
                  {market.name}
                  <span className="mt-0.5 block text-xs font-normal tracking-normal text-muted">
                    {VENUE_META[market.venue].label} · {VENUE_META[market.venue].posted}
                  </span>
                </span>
              </SheetTitle>
              <SheetDescription className="text-muted">{market.blurb}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-5 pb-8">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
                  <p className="kicker">Your folio</p>
                  <p className="mt-1 font-medium">{seeing ? `${qty(have, 4)} ${market.ticker}` : "—"}</p>
                </div>
                <div className="rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
                  <p className="kicker">In this market</p>
                  <p className="mt-1 font-medium">{staked > 0 ? `${qty(staked, 4)} ${market.ticker}` : "—"}</p>
                </div>
              </div>

              <div className="flex rounded-md bg-elevated p-1">
                {(["in", "out"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setMsg(null);
                    }}
                    className={`h-10 flex-1 rounded-sm text-xs font-medium tracking-wide uppercase ${
                      mode === m ? "bg-accent text-accent-fg" : "text-muted"
                    }`}
                  >
                    {m === "in" ? "Supply" : "Withdraw"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="kicker">Amount · {market.ticker}</span>
                <div className="mt-2 flex gap-2">
                  <Input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setMsg(null);
                    }}
                    placeholder="0.00"
                    className="num h-11 border-border bg-bg text-fg"
                  />
                  <Button variant="outline" type="button" onClick={() => setAmount(String(max))}>
                    Max
                  </Button>
                </div>
              </label>
              <p className="text-xs text-muted">
                {Number.isFinite(n) && n > 0 ? `≈ ${usd(notional)} at mark.` : `Available ${qty(max, 4)} ${market.ticker}.`}
              </p>

              <Button variant="accent" onClick={submit}>
                {mode === "in" ? `Supply ${market.ticker}` : `Withdraw ${market.ticker}`}
              </Button>
              {msg ? <p className="text-xs text-accent">{msg}</p> : null}
              <p className="text-xs leading-relaxed text-muted">
                Markets are wired to Morpho isolated / Midnight, Aave V4 hub + tokenized spoke, and Uniswap on Arc. No fill until those contracts are public on 5042 and the stock token exists. Preview deposits stay on this device.
              </p>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
