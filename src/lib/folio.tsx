"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { MARKETS, type Market } from "./markets";
import {
  PREVIEW_DISTRIBUTIONS,
  PREVIEW_HOLDER,
  earnedValue,
  type Distribution,
} from "./stocks";

type Positions = Record<string, number>;

type FolioState = {
  preview: boolean;
  setPreview: (v: boolean) => void;
  address?: string;
  connected: boolean;
  seeing: boolean;
  stonk: number;
  sharePct: number;
  holderUsdc: number;
  earned: Record<string, number>;
  available: Record<string, number>;
  positions: Positions;
  history: Distribution[];
  stocksEarnedUsd: number;
  deposit: (market: Market, amount: number) => { ok: true } | { ok: false; reason: string };
  withdraw: (market: Market, amount: number) => { ok: true } | { ok: false; reason: string };
};

const FolioCtx = createContext<FolioState | null>(null);
const LS_PREVIEW = "stonkfolio:preview";
const LS_POS = "stonkfolio:positions";

function loadPositions(): Positions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_POS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Positions;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function FolioProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [preview, setPreviewState] = useState(false);
  const [positions, setPositions] = useState<Positions>({});

  useEffect(() => {
    setPreviewState(localStorage.getItem(LS_PREVIEW) === "1");
    setPositions(loadPositions());
  }, []);

  const setPreview = useCallback((v: boolean) => {
    setPreviewState(v);
    localStorage.setItem(LS_PREVIEW, v ? "1" : "0");
  }, []);

  const seeing = Boolean(preview || isConnected);
  const demo = preview;
  const earned = demo ? PREVIEW_HOLDER.earned : {};
  const stonk = demo ? PREVIEW_HOLDER.stonk : 0;
  const sharePct = demo ? PREVIEW_HOLDER.sharePct : 0;
  const holderUsdc = demo ? PREVIEW_HOLDER.holderUsdc : 0;
  const history = demo ? PREVIEW_DISTRIBUTIONS : [];

  const available = useMemo(() => {
    const out: Record<string, number> = { ...earned };
    for (const m of MARKETS) {
      const used = positions[m.id] ?? 0;
      if (!used) continue;
      out[m.ticker] = Math.max(0, (out[m.ticker] ?? 0) - used);
    }
    return out;
  }, [earned, positions]);

  const persist = useCallback((next: Positions) => {
    setPositions(next);
    localStorage.setItem(LS_POS, JSON.stringify(next));
  }, []);

  const deposit = useCallback(
    (market: Market, amount: number) => {
      if (!seeing) return { ok: false as const, reason: "Connect a wallet first." };
      if (!(amount > 0)) return { ok: false as const, reason: "Enter an amount." };
      const have = available[market.ticker] ?? 0;
      if (amount > have + 1e-12) {
        return { ok: false as const, reason: `Only ${have} ${market.ticker} is sitting in your folio.` };
      }
      persist({ ...positions, [market.id]: (positions[market.id] ?? 0) + amount });
      return { ok: true as const };
    },
    [available, persist, positions, seeing],
  );

  const withdraw = useCallback(
    (market: Market, amount: number) => {
      const have = positions[market.id] ?? 0;
      if (!(amount > 0)) return { ok: false as const, reason: "Enter an amount." };
      if (amount > have + 1e-12) return { ok: false as const, reason: "Nothing to pull." };
      const next = { ...positions, [market.id]: have - amount };
      if (next[market.id] <= 1e-12) delete next[market.id];
      persist(next);
      return { ok: true as const };
    },
    [persist, positions],
  );

  const value: FolioState = {
    preview,
    setPreview,
    address,
    connected: Boolean(isConnected),
    seeing,
    stonk,
    sharePct,
    holderUsdc,
    earned,
    available,
    positions,
    history,
    stocksEarnedUsd: earnedValue(earned),
    deposit,
    withdraw,
  };

  return <FolioCtx.Provider value={value}>{children}</FolioCtx.Provider>;
}

export function useFolio() {
  const ctx = useContext(FolioCtx);
  if (!ctx) throw new Error("useFolio outside provider");
  return ctx;
}
