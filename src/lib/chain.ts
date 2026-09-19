import { defineChain } from "viem";

/** Arc mainnet. Native gas is USDC at 18dp; ERC-20 USDC is 6dp at the precompile. */
export const ARC_CHAIN_ID = 5042;
export const ARC_USDC_ERC20 = "0x3600000000000000000000000000000000000000" as const;
export const ARC_EXPLORER = "https://arc-scan.org";
export const EVE_FUN = "https://www.eve.fun";
export const EVE_LAUNCH = "https://www.eve.fun/create";

export const MAINNET_AT = new Date("2026-09-16T18:00:00.000Z");

export const arc = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        "https://arc-mainnet-rpc.baracat.meme",
        "https://rpc.arc-scan.org",
      ],
    },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: ARC_EXPLORER },
  },
});

export const TOKEN = {
  name: "Stonkfolio",
  symbol: "SFOLIO",
  supply: 1_000_000_000,
  launchpad: "eve.fun Instant v4",
  pair: "SFOLIO / USDC",
  poolFeeBps: 100,
  holdersBps: 0,
  creatorBps: 7_000,
  burnBps: 1_000,
  autoLpBps: 1_000,
  platformBps: 1_000,
} as const;
