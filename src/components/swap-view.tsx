"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, Search, Settings2, TriangleAlert } from "lucide-react";
import type { Address } from "viem";
import { useAccount, useConnect, useSwitchChain, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ARC_CHAIN_ID, ARC_EXPLORER } from "@/lib/chain";
import { cn } from "@/lib/utils";
import { addOrSwitchArc } from "@/lib/wagmi";
import { STOCKS } from "@/lib/stocks";
import {
  DEFAULT_SLIPPAGE_BPS,
  IMPACT_CONFIRM_PCT,
  IMPACT_WARN_PCT,
  SWAP_ROUTER,
  SWAP_TOKENS,
  buildSwapTx,
  erc20Abi,
  formatTokenAmount,
  friendlyError,
  impactLevel,
  loadXStockToken,
  makeSwapClient,
  minReceived,
  parseAmount,
  parseSlippagePct,
  quoteBest,
  routeLabel,
  sameToken,
  toInputString,
  tooPrecise,
  type BestQuote,
  type SwapToken,
} from "@/lib/swap";

const SLIPPAGE_PRESETS = [50, 100, 300] as const;
/** Leave this much USDC when swapping the whole balance: gas on Arc is paid in USDC. */
const USDC_GAS_RESERVE = 100_000n;

type QuoteState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; q: BestQuote }
  | { kind: "none" }
  | { kind: "error"; message: string };

function TokenDot({ t, size = 28 }: { t: Pick<SwapToken, "symbol" | "color">; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-white"
      style={{ width: size, height: size, background: t.color }}
      aria-hidden
    >
      {t.symbol.slice(0, 2)}
    </span>
  );
}

export function SwapView() {
  const client = useMemo(() => makeSwapClient(), []);
  const qc = useQueryClient();
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending: connecting } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const onArc = isConnected && chainId === ARC_CHAIN_ID;

  // xStocks that have an Arc address AND a funded USDC pool join the token list on their own.
  const xRes = useQuery({
    queryKey: ["swap-xstocks"],
    queryFn: async () => {
      const res = await fetch("/api/xstocks/assets");
      if (!res.ok) return [] as SwapToken[];
      const body = (await res.json()) as { ok?: boolean; stocks?: { xSymbol: string; catalogArcAddress: string | null }[] };
      if (!body.ok || !body.stocks) return [] as SwapToken[];
      const found = await Promise.all(
        body.stocks
          .filter((s) => s.catalogArcAddress)
          .map((s) => loadXStockToken(client, s.catalogArcAddress as string, s.xSymbol)),
      );
      return found.filter((t): t is SwapToken => Boolean(t));
    },
    staleTime: 10 * 60_000,
    retry: false,
  });
  const tokens = useMemo<readonly SwapToken[]>(() => [...SWAP_TOKENS, ...(xRes.data ?? [])], [xRes.data]);
  const liveX = new Set((xRes.data ?? []).map((t) => t.symbol));
  const comingSoon = STOCKS.filter((s) => s.xSymbol && !liveX.has(s.xSymbol));

  const [tokenIn, setTokenIn] = useState<SwapToken>(SWAP_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<SwapToken>(SWAP_TOKENS[1]);
  const [amountStr, setAmountStr] = useState("");
  const [slipBps, setSlipBps] = useState<number>(DEFAULT_SLIPPAGE_BPS);
  const [slipCustom, setSlipCustom] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [picker, setPicker] = useState<"in" | "out" | null>(null);
  const [busy, setBusy] = useState<null | "approve" | "swap">(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string; tx?: string } | null>(null);

  const amountIn = parseAmount(amountStr, tokenIn.decimals);
  const precisionErr = Boolean(amountStr) && tooPrecise(amountStr, tokenIn.decimals);

  // Balances for every listed token, one multicall.
  const balances = useQuery({
    queryKey: ["swap-balances", address, tokens.map((t) => t.symbol).join()],
    enabled: Boolean(address && onArc),
    refetchInterval: 30_000,
    queryFn: async () => {
      const res = await client.multicall({
        allowFailure: true,
        contracts: tokens.map((t) => ({ address: t.address, abi: erc20Abi, functionName: "balanceOf" as const, args: [address as Address] as const })),
      });
      const out: Record<string, bigint> = {};
      tokens.forEach((t, i) => {
        const r = res[i];
        out[t.symbol] = r.status === "success" ? (r.result as bigint) : 0n;
      });
      return out;
    },
  });
  const balIn = balances.data?.[tokenIn.symbol];
  const balOut = balances.data?.[tokenOut.symbol];

  const allowance = useQuery({
    queryKey: ["swap-allowance", address, tokenIn.address],
    enabled: Boolean(address && onArc),
    queryFn: () => client.readContract({ address: tokenIn.address, abi: erc20Abi, functionName: "allowance", args: [address as Address, SWAP_ROUTER] }),
  });

  // Debounced quote (400ms). The query key only changes after typing pauses.
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(amountStr), 400);
    return () => clearTimeout(timer);
  }, [amountStr]);
  const debouncedIn = parseAmount(debounced, tokenIn.decimals);
  const sameTokens = sameToken(tokenIn, tokenOut);
  const quoteQuery = useQuery({
    queryKey: ["swap-quote", tokenIn.address, tokenOut.address, debouncedIn?.toString() ?? "", tokens.length],
    enabled: Boolean(debouncedIn) && !sameTokens,
    staleTime: 15_000,
    retry: false,
    queryFn: () => quoteBest(client, tokens, tokenIn.address, tokenOut.address, debouncedIn as bigint),
  });
  const quote: QuoteState =
    !amountIn || sameTokens
      ? { kind: "idle" }
      : debounced !== amountStr || quoteQuery.isFetching
        ? { kind: "loading" }
        : quoteQuery.isError
          ? { kind: "error", message: friendlyError(quoteQuery.error) }
          : quoteQuery.data
            ? { kind: "ok", q: quoteQuery.data }
            : { kind: "none" };

  // A new quote always needs a fresh look at a big price impact.
  const quoteKey = quote.kind === "ok" ? `${tokenIn.symbol}-${tokenOut.symbol}-${quote.q.amountIn}-${quote.q.best.amountOut}` : "";
  const [confirmedKey, setConfirmedKey] = useState("");
  const bigImpactOk = Boolean(quoteKey) && confirmedKey === quoteKey;

  const q = quote.kind === "ok" ? quote.q : null;
  const minOut = q ? minReceived(q.best.amountOut, slipBps) : null;
  const level = q ? impactLevel(q.impactPct) : "ok";
  const needsAllowance = Boolean(amountIn && allowance.data !== undefined && allowance.data < amountIn);

  const flip = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountStr("");
    setNotice(null);
  }, [tokenIn, tokenOut]);

  function pick(side: "in" | "out", t: SwapToken) {
    setNotice(null);
    if (side === "in") {
      if (sameToken(t, tokenOut)) setTokenOut(tokenIn);
      setTokenIn(t);
      setAmountStr("");
    } else {
      if (sameToken(t, tokenIn)) setTokenIn(tokenOut);
      setTokenOut(t);
    }
    setPicker(null);
  }

  function setMax() {
    if (balIn === undefined) return;
    let v = balIn;
    if (tokenIn.symbol === "USDC") v = v > USDC_GAS_RESERVE ? v - USDC_GAS_RESERVE : 0n;
    setAmountStr(v > 0n ? toInputString(v, tokenIn.decimals) : "");
  }

  async function connectWallet() {
    setNotice(null);
    const connector = connectors.find((c) => c.id === "injected" || c.type === "injected") ?? connectors[0];
    if (!connector) {
      setNotice({ tone: "err", text: "No injected wallet found. Install MetaMask or Rabby." });
      return;
    }
    try {
      await connectAsync({ connector, chainId: ARC_CHAIN_ID });
    } catch (err) {
      setNotice({ tone: "err", text: friendlyError(err) });
    }
  }

  async function switchToArc() {
    setNotice(null);
    try {
      try {
        await switchChainAsync({ chainId: ARC_CHAIN_ID });
      } catch {
        await addOrSwitchArc();
      }
    } catch (err) {
      setNotice({ tone: "err", text: friendlyError(err) });
    }
  }

  async function approve() {
    if (!address || !amountIn) return;
    setBusy("approve");
    setNotice(null);
    try {
      // Exact amount, not infinite.
      const hash = await writeContractAsync({
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [SWAP_ROUTER, amountIn],
        chainId: ARC_CHAIN_ID,
      });
      const rcpt = await client.waitForTransactionReceipt({ hash });
      if (rcpt.status !== "success") throw new Error("Approval failed on-chain.");
      await allowance.refetch();
      setNotice({ tone: "ok", text: `${tokenIn.symbol} approved for this swap.`, tx: hash });
    } catch (err) {
      setNotice({ tone: "err", text: friendlyError(err) });
    } finally {
      setBusy(null);
    }
  }

  async function swap() {
    if (!address || !amountIn || !q || minOut === null) return;
    // Final guards before the wallet opens.
    if (q.best.amountOut <= 0n || minOut <= 0n) {
      setNotice({ tone: "err", text: "The quote came back empty. Try again." });
      return;
    }
    setBusy("swap");
    setNotice(null);
    try {
      const tx = buildSwapTx({ route: q.best.route, amountIn, minOut, recipient: address });
      const hash = await writeContractAsync({ ...tx, args: [...tx.args] as never, chainId: ARC_CHAIN_ID } as never);
      const rcpt = await client.waitForTransactionReceipt({ hash });
      if (rcpt.status !== "success") throw new Error("The swap reverted on-chain. No funds moved.");
      setNotice({ tone: "ok", text: `Swapped ${formatTokenAmount(amountIn, tokenIn.decimals)} ${tokenIn.symbol} for ${tokenOut.symbol}.`, tx: hash });
      setAmountStr("");
      await Promise.all([balances.refetch(), allowance.refetch()]);
      qc.invalidateQueries({ queryKey: ["swap-balances"] });
    } catch (err) {
      setNotice({ tone: "err", text: friendlyError(err) });
    } finally {
      setBusy(null);
    }
  }

  // ---- primary button state machine ----
  let label = "Swap";
  let action: (() => void) | null = swap;
  let disabled = false;
  if (!isConnected) {
    label = connecting ? "Connecting…" : "Connect wallet";
    action = connectWallet;
    disabled = connecting;
  } else if (!onArc) {
    label = "Switch to Arc";
    action = switchToArc;
  } else if (sameToken(tokenIn, tokenOut)) {
    label = "Pick two different tokens";
    disabled = true;
  } else if (!amountStr || (!amountIn && !precisionErr)) {
    label = "Enter an amount";
    disabled = true;
  } else if (precisionErr) {
    label = `${tokenIn.symbol} has ${tokenIn.decimals} decimals`;
    disabled = true;
  } else if (balIn !== undefined && amountIn && amountIn > balIn) {
    label = `Insufficient ${tokenIn.symbol} balance`;
    disabled = true;
  } else if (quote.kind === "loading" || quote.kind === "idle") {
    label = "Finding best route…";
    disabled = true;
  } else if (quote.kind === "none") {
    label = "No route available";
    disabled = true;
  } else if (quote.kind === "error") {
    label = "Quote unavailable";
    disabled = true;
  } else if (busy === "approve") {
    label = "Confirm in wallet…";
    disabled = true;
  } else if (busy === "swap") {
    label = "Swapping…";
    disabled = true;
  } else if (needsAllowance) {
    label = `Approve ${tokenIn.symbol}`;
    action = approve;
  } else if (level === "confirm" && !bigImpactOk) {
    label = "Confirm price impact to swap";
    disabled = true;
  }

  const rate = q && amountIn
    ? (Number(q.best.amountOut) / 10 ** tokenOut.decimals) / (Number(amountIn) / 10 ** tokenIn.decimals)
    : null;
  const slipPct = slipBps / 100;
  const lowSlip = slipBps < 10;
  const highSlip = slipBps > 500;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">Swap</p>
      <h1 className="display-md mt-3">Swap on Arc.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Trade USDC, EURC, cirBTC and WETH on Uniswap v3 from your own wallet.
      </p>

      <div className="panel mt-8 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-sm font-medium">Trade</span>
          <Button variant="ghost" size="icon-sm" aria-label="Slippage settings" onClick={() => setShowSettings((v) => !v)}>
            <Settings2 className="size-4" />
          </Button>
        </div>

        {showSettings ? (
          <div className="panel-tight mb-3 p-4">
            <p className="text-xs text-muted">Max slippage</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {SLIPPAGE_PRESETS.map((p) => (
                <Button
                  key={p}
                  size="xs"
                  variant={slipBps === p && !slipCustom ? "accent" : "outline"}
                  onClick={() => {
                    setSlipBps(p);
                    setSlipCustom("");
                  }}
                >
                  {p / 100}%
                </Button>
              ))}
              <div className="flex items-center gap-1">
                <input
                  inputMode="decimal"
                  placeholder="Custom"
                  value={slipCustom}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSlipCustom(v);
                    const bps = parseSlippagePct(v);
                    if (bps !== null) setSlipBps(bps);
                  }}
                  aria-label="Custom slippage percent"
                  className="h-8 w-20 rounded-sm bg-elevated px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-xs text-muted">%</span>
              </div>
            </div>
            {slipCustom && parseSlippagePct(slipCustom) === null ? (
              <p className="mt-2 text-xs text-down">Enter a value from 0.01 to 50.</p>
            ) : null}
            {lowSlip ? <p className="mt-2 text-xs text-down">Very low slippage. The swap may fail.</p> : null}
            {highSlip ? <p className="mt-2 text-xs text-down">High slippage. You could get a much worse price.</p> : null}
          </div>
        ) : null}

        {/* Pay */}
        <div className="panel-tight p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>You pay</span>
            <span className="flex items-center gap-2">
              {balIn !== undefined ? <span className="num">Balance {formatTokenAmount(balIn, tokenIn.decimals)}</span> : null}
              {balIn !== undefined && balIn > 0n ? (
                <button type="button" onClick={setMax} className="font-medium text-accent hover:underline">
                  MAX
                </button>
              ) : null}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.0"
              value={amountStr}
              onChange={(e) => {
                const v = e.target.value.replace(/,/g, ".");
                if (/^\d*\.?\d*$/.test(v)) {
                  setAmountStr(v);
                  setNotice(null);
                }
              }}
              aria-label="Amount to pay"
              className="num min-w-0 flex-1 bg-transparent text-2xl outline-none placeholder:text-subtle"
            />
            <Button variant="secondary" size="default" className="shrink-0 gap-2 px-3" onClick={() => setPicker("in")}>
              <TokenDot t={tokenIn} size={22} />
              {tokenIn.symbol}
            </Button>
          </div>
        </div>

        <div className="relative z-10 -my-3 flex justify-center">
          <Button variant="outline" size="icon-sm" className="bg-surface" aria-label="Flip tokens" onClick={flip}>
            <ArrowDownUp className="size-4" />
          </Button>
        </div>

        {/* Receive */}
        <div className="panel-tight p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>You receive</span>
            {balOut !== undefined ? <span className="num">Balance {formatTokenAmount(balOut, tokenOut.decimals)}</span> : null}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <output
              aria-label="Amount to receive"
              className={cn("num min-w-0 flex-1 truncate text-2xl", q ? "text-fg" : "text-subtle")}
            >
              {q ? formatTokenAmount(q.best.amountOut, tokenOut.decimals, 8) : quote.kind === "loading" ? "…" : "0.0"}
            </output>
            <Button variant="secondary" size="default" className="shrink-0 gap-2 px-3" onClick={() => setPicker("out")}>
              <TokenDot t={tokenOut} size={22} />
              {tokenOut.symbol}
            </Button>
          </div>
        </div>

        {/* Info rows */}
        {q && minOut !== null && rate !== null ? (
          <dl className="mt-3 space-y-2 px-1 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Rate</dt>
              <dd className="num text-right">
                1 {tokenIn.symbol} ≈ {formatTokenAmount(BigInt(Math.max(0, Math.round(rate * 10 ** tokenOut.decimals))), tokenOut.decimals, 8)} {tokenOut.symbol}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Minimum received</dt>
              <dd className="num text-right">
                {formatTokenAmount(minOut, tokenOut.decimals, 8)} {tokenOut.symbol}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Price impact</dt>
              <dd
                className={cn(
                  "num text-right",
                  level === "warn" && "text-down",
                  level === "confirm" && "font-semibold text-down",
                )}
              >
                {q.impactPct === null ? "n/a" : q.impactPct < 0.01 ? "<0.01%" : `${q.impactPct.toFixed(2)}%`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Route</dt>
              <dd className="text-right">{routeLabel(q.best.route, tokens)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Max slippage</dt>
              <dd className="num text-right">{slipPct}%</dd>
            </div>
          </dl>
        ) : null}

        {level !== "ok" && q ? (
          <div className="mt-3 rounded-md bg-down/10 p-3 text-xs text-down" role="alert">
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                {level === "confirm"
                  ? `This trade moves the price by about ${q.impactPct?.toFixed(1)}%. These pools are thin and you may lose a lot to price impact.`
                  : `Price impact is above ${IMPACT_WARN_PCT}%. Consider a smaller amount.`}
              </span>
            </p>
            {level === "confirm" ? (
              <label className="mt-2 flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={bigImpactOk} onChange={(e) => setConfirmedKey(e.target.checked ? quoteKey : "")} />
                <span>I understand the price impact is over {IMPACT_CONFIRM_PCT}% and want to continue.</span>
              </label>
            ) : null}
          </div>
        ) : null}

        {quote.kind === "none" ? (
          <p className="mt-3 px-1 text-xs text-muted">
            No pool with liquidity connects these two tokens right now, or the pools are too thin for this size.
          </p>
        ) : null}
        {quote.kind === "error" ? <p className="mt-3 px-1 text-xs text-down">{quote.message}</p> : null}
        {tokenIn.symbol === "USDC" && amountIn && balIn !== undefined && amountIn > balIn - USDC_GAS_RESERVE && amountIn <= balIn ? (
          <p className="mt-3 px-1 text-xs text-muted">Arc pays gas in USDC. Keep a little USDC to cover the network fee.</p>
        ) : null}

        <Button size="lg" className="mt-4 w-full" disabled={disabled} onClick={() => action?.()}>
          {label}
        </Button>

        {notice ? (
          <p className={cn("mt-3 px-1 text-xs", notice.tone === "ok" ? "text-up" : "text-down")} role="status">
            {notice.text}{" "}
            {notice.tx ? (
              <a
                href={`${ARC_EXPLORER}/tx/${notice.tx}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline-offset-2 hover:underline"
              >
                View on Arcscan
              </a>
            ) : null}
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Swaps execute on Uniswap v3 on Arc from your own wallet. Stonkfolio takes no fee and never holds your funds.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Crypto swaps carry risk, including thin liquidity and price impact. Read the{" "}
        <Link href="/risk" className="text-fg underline-offset-2 hover:underline">
          Risk Disclosure
        </Link>
        .
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl italic tracking-tight">Coming soon</h2>
        <p className="mt-2 text-sm text-muted">
          Tokenized stocks from xStocks are announced for Arc but not deployed yet. Each one turns on here by itself once it has
          an Arc contract and a funded pool.
        </p>
        <ul className="mt-4 divide-y divide-border">
          {comingSoon.map((s) => (
            <li key={s.ticker} className="flex items-center justify-between gap-4 py-3 text-sm opacity-60">
              <span className="flex items-center gap-3">
                <TokenDot t={{ symbol: s.ticker, color: s.color }} size={28} />
                <span>
                  <span className="block font-medium">{s.xSymbol}</span>
                  <span className="block text-xs text-muted">{s.name}</span>
                </span>
              </span>
              <span className="rounded-full bg-elevated px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </section>

      <TokenPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        tokens={tokens}
        balances={balances.data}
        selected={picker === "out" ? tokenOut : tokenIn}
        onPick={(t) => picker && pick(picker, t)}
      />
    </div>
  );
}

function TokenPicker({
  open,
  onClose,
  tokens,
  balances,
  selected,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  tokens: readonly SwapToken[];
  balances: Record<string, bigint> | undefined;
  selected: SwapToken;
  onPick: (t: SwapToken) => void;
}) {
  const [term, setTerm] = useState("");
  const list = tokens.filter((t) => {
    const s = term.trim().toLowerCase();
    return !s || t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s) || t.address.toLowerCase() === s;
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTerm("");
          onClose();
        }
      }}
    >
      <DialogContent className="bg-surface text-fg">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md bg-elevated px-3">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search name or symbol"
            aria-label="Search tokens"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto">
          {list.map((t) => (
            <li key={t.address}>
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  onPick(t);
                }}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-2 text-left hover:bg-elevated",
                  sameToken(t, selected) && "bg-elevated",
                )}
              >
                <span className="flex items-center gap-3">
                  <TokenDot t={t} />
                  <span>
                    <span className="block text-sm font-medium">{t.symbol}</span>
                    <span className="block text-xs text-muted">{t.name}</span>
                  </span>
                </span>
                {balances ? <span className="num text-xs text-muted">{formatTokenAmount(balances[t.symbol] ?? 0n, t.decimals)}</span> : null}
              </button>
            </li>
          ))}
          {!list.length ? <li className="px-2 py-6 text-center text-sm text-muted">No token found.</li> : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
