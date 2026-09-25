import { getAddress, type Address } from "viem";
import { ARC_USDC_ERC20 } from "./chain";
import { STOCKS, sleeveWeight } from "./stocks";

/** Eve Circle Agent Wallet SCA — same address as EVE_PAYTO. Live on Arc. */
export const EVE_AGENT_WALLET = getAddress("0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F");

/** Eve Arc Facilitator receive wallet (EVE_CIRCLE_PAYTO). x402 on Arc. */
export const EVE_ARC_FACILITATOR = getAddress("0x0e56d191219fa7a4a8a50d17d4ce838e80bf566e");

/** Hashnote / Circle USYC on Arc mainnet. Not the cash sleeve. */
export const ARC_USYC = getAddress("0x8a5D989Bbb96929F689B0200f435f53dA42bF490");

/** Dialectic RWA USDC vault on Circle Earn (Morpho, Arc). The 5% sleeve deposits here. */
export const EARN_VAULT = getAddress("0x6bdfe1165d5165808d02de05969c9a19e9b7cf30");

/** FolioTreasury on Arc. Owner is the Air EOA. On-chain keeper is the distributor. */
export const FOLIO_TREASURY_LIVE = getAddress("0xd47B04A41b3734EAb2687ef01d07881D05F9215e");

/** Pushes a merkle round of stocks to holders. Treasury.keeper. */
export const FOLIO_DISTRIBUTOR = getAddress("0xf2815231F61A1A0cBA8BCDCBA41b22c26Ca4cB25");

/** Creator wallet. Gets 10% of the launch-fee USDC that reaches the keeper. Same as scripts/keeper/cycle.mjs. */
export const CREATOR_CUT_WALLET = getAddress("0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9");

/** Cut when another app funds the book. 5%. Their holders get the rest. */
export const BOOK_SERVICE_FEE_BPS = 500;

/** Fee USDC must reach this before a cycle buys. Below it, the USDC waits. */
export const MIN_BUY_USDC = 150;

const ZERO = "0x0000000000000000000000000000000000000000";

function envAddr(name: string, fallback: Address): Address {
  const raw = (process.env[name] || process.env[`NEXT_PUBLIC_${name}`])?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw)) return fallback;
  return getAddress(raw);
}

export function keeperAddress(): Address {
  return envAddr("KEEPER_AGENT_WALLET", EVE_AGENT_WALLET);
}

export function x402PayTo(): Address {
  return envAddr("X402_PAYTO", EVE_ARC_FACILITATOR);
}

export function treasuryAddress(): Address | null {
  const raw = (process.env.FOLIO_TREASURY || process.env.NEXT_PUBLIC_FOLIO_TREASURY)?.trim();
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw) || raw.toLowerCase() === ZERO) return FOLIO_TREASURY_LIVE;
  return getAddress(raw);
}

export function usycAddress(): Address {
  return envAddr("USYC_ADDRESS", ARC_USYC);
}

/** Addresses the agent wallet may touch, including the creator wallet it pays. Used for Circle CLI allowlists. */
export function keeperAllowlist(): Address[] {
  const extra = treasuryAddress();
  const list = [ARC_USDC_ERC20, EARN_VAULT, keeperAddress(), x402PayTo(), CREATOR_CUT_WALLET];
  if (extra) list.push(extra);
  return [...new Set(list.map((a) => getAddress(a)))];
}

export type KeeperAction = "park" | "buy" | "hold";

export function keeperPlan(args?: { listedTickers?: string[] }): {
  action: KeeperAction;
  reason: string;
  cashSleeveBps: number;
  listedWeight: number;
  queuedWeight: number;
} {
  const listed = new Set((args?.listedTickers ?? STOCKS.filter((s) => s.tradeable).map((s) => s.ticker)).map((t) => t.toUpperCase()));
  const listedWeight = STOCKS.filter((s) => listed.has(s.ticker)).reduce((n, s) => n + s.weight, 0);
  const queuedWeight = STOCKS.filter((s) => !listed.has(s.ticker)).reduce((n, s) => n + s.weight, 0);
  const cashSleeveBps = sleeveWeight("mmf") * 100;

  if (listedWeight === 0) {
    return {
      action: "park",
      reason: "Nothing tradeable yet. Fee USDC waits in the wallet (Arc dShares deployed but unminted).",
      cashSleeveBps,
      listedWeight,
      queuedWeight,
    };
  }
  if (queuedWeight > 0) {
    return {
      action: "buy",
      reason: `Buy once fee USDC reaches ${MIN_BUY_USDC}. Keep ${cashSleeveBps / 100}% in Circle Earn.`,
      cashSleeveBps,
      listedWeight,
      queuedWeight,
    };
  }
  return {
    action: "buy",
    reason: `Buy once fee USDC reaches ${MIN_BUY_USDC}. Keep ${cashSleeveBps / 100}% in Circle Earn.`,
    cashSleeveBps,
    listedWeight,
    queuedWeight,
  };
}

export function circleCliParkCommands(usdcAmount = "10") {
  const keeper = keeperAddress();
  const raw = BigInt(Math.round(Number(usdcAmount) * 1_000_000));
  return [
    `circle wallet list --type agent --chain ARC`,
    `circle wallet balance --address ${keeper} --chain ARC`,
    `circle wallet limit set --address ${keeper} --chain ARC --policy-type stablecoin --per-tx 500 --daily 5000`,
    `circle wallet execute --address ${keeper} --chain ARC --contract ${ARC_USDC_ERC20} --fn approve --args ${EARN_VAULT},${raw}`,
    `circle wallet execute --address ${keeper} --chain ARC --contract ${EARN_VAULT} --fn deposit --args ${raw},${keeper}`,
  ];
}

export const KEEPER_HOST = {
  name: "Jessica’s MacBook Air",
  ssh: "jessica-m1",
  tailscale: "jessicas-macbook-air.tailf9fd35.ts.net",
  launchd: "com.stonkfolio.keeper",
  path: "/Users/hectorhernandez/code/stonkfolio",
} as const;
