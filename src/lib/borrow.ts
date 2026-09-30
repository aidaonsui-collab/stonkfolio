import { getAddress } from "viem";

/**
 * Circle Borrow Kit on Arc: crypto-backed USDC/EURC loans on Morpho Blue markets.
 * The loan is the user's own position. StonkFolio only attaches an origination fee.
 */
export const BORROW_CHAIN = "Arc" as const;

/** Origination fee on each borrow, in bps of the amount borrowed. Registered once by scripts/borrow/set-integrator-fee.mjs. */
export const BORROW_FEE_BPS = 25;

/** Arcfun platform wallet: owner and treasury of the live Arcfun Instant factory 0x05BF…323a on Arc. */
export const BORROW_FEE_WALLET = getAddress("0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9");

/** Only stablecoin loans are shown. Other markets on Arc lend test tokens. */
export const BORROW_LOAN_ASSETS = ["USDC", "EURC"] as const;

/** Below this much free liquidity a market is shown as full and cannot be borrowed from. */
export const MIN_BORROW_LIQUIDITY = 1;

export const ARC_TX_EXPLORER = "https://explorer.arc.io/tx/";

const COLLATERAL_LABEL: Record<string, string> = {
  cirBTC: "Bitcoin",
  WETH: "Ether",
  XAUM: "Gold",
  sUSDai: "USD.AI savings",
  syrupUSDC: "Maple USDC",
};

export function collateralLabel(symbol: string) {
  return COLLATERAL_LABEL[symbol] ?? null;
}

/** Borrow Kit wants a positive decimal string. Six decimals covers USDC and EURC. */
export function formatBorrowAmount(raw: string) {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) throw new Error("Enter an amount.");
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive amount.");
  const out = (Math.floor(n * 1_000_000) / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
  if (out === "0" || out === "") throw new Error("Amount too small.");
  return out;
}
