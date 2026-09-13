"use client";

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
    setMsg(mode === "in" ? "Position marked on this board. Fills wait on Arc RWA + venue contracts." : "Pulled back to your folio.");
    setAmount("");
  }

  return (
    <Sheet open={Boolean(market)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full border-[rgba(200,245,66,0.12)] bg-[#0e110e] data-[side=right]:w-full data-[side=right]:sm:max-w-[420px] sm:max-w-[420px]"
      >
        {market ? (
          <>
            <SheetHeader className="border-b border-white/5">
              <SheetTitle className="flex items-center gap-3 text-[#eef6e6]">
                {stock ? <StockMark stock={stock} size={40} /> : null}
                <span>
                  {market.name}
                  <span className="mt-0.5 block text-xs font-normal tracking-normal text-[#8a9480]">
                    {VENUE_META[market.venue].label} · {VENUE_META[market.venue].posted}
                  </span>
                </span>
              </SheetTitle>
              <SheetDescription className="text-[#8a9480]">{market.blurb}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Your folio" value={seeing ? `${qty(have, 4)} ${market.ticker}` : "—"} />
                <Stat label="In this market" value={staked > 0 ? `${qty(staked, 4)} ${market.ticker}` : "—"} />
              </div>

              <div className="flex rounded-xl bg-white/5 p-1">
                {(["in", "out"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setMsg(null);
                    }}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-[0.12em] uppercase ${
                      mode === m ? "bg-[#c8f542] text-[#0b1208]" : "text-[#9aa392]"
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
                    className="h-12 border-white/10 bg-[#0a0c0a] text-base text-[#eef6e6]"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-3 text-xs font-semibold tracking-wider text-[#c8f542] uppercase"
                    onClick={() => setAmount(String(max))}
                  >
                    Max
                  </button>
                </div>
              </label>
              <p className="text-xs text-[#6d7666]">
                {Number.isFinite(n) && n > 0 ? `≈ ${usd(notional)} at mark.` : `Available ${qty(max, 4)} ${market.ticker}.`}
              </p>

              <button
                type="button"
                onClick={submit}
                className="h-12 rounded-xl bg-[#c8f542] text-sm font-semibold text-[#0b1208] hover:bg-[#d6ff6a]"
              >
                {mode === "in" ? `Supply ${market.ticker}` : `Withdraw ${market.ticker}`}
              </button>
              {msg ? <p className="text-xs text-[#c8f542]">{msg}</p> : null}
              <p className="text-[11px] leading-relaxed text-[#6d7666]">
                Markets are wired to the venues Arc and Circle posted: Morpho isolated / Midnight, Aave V4 hub + tokenized spoke, Uniswap on Arc. No fill until those contracts are public on 5042 and the stock token exists. Preview deposits stay on this device.
              </p>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] tracking-[0.14em] text-[#6d7666] uppercase">{label}</p>
      <p className="mt-1 font-medium text-[#eef6e6]">{value}</p>
    </div>
  );
}
