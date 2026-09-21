import { getAddress, type Address } from "viem";
import { ARC_USDC_ERC20 } from "./chain";
import { STOCKS, sleeveWeight } from "./stocks";

/** Eve Circle Agent Wallet SCA — same address as EVE_PAYTO. Live on Arc. */
export const EVE_AGENT_WALLET = getAddress("0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F");

/** Eve Arc Facilitator receive wallet (EVE_CIRCLE_PAYTO). x402 on Arc. */
export const EVE_ARC_FACILITATOR = getAddress("0x0e56d191219fa7a4a8a50d17d4ce838e80bf566e");

/** Hashnote / Circle USYC on Arc mainnet. */
export const ARC_USYC = getAddress("0x8a5D989Bbb96929F689B0200f435f53dA42bF490");

/** FolioTreasury on Arc. Owner is the Air EOA. On-chain keeper is the distributor. */
export const FOLIO_TREASURY_LIVE = getAddress("0xd47B04A41b3734EAb2687ef01d07881D05F9215e");

/** Pushes a merkle round of stocks to holders. Treasury.keeper. */
export const FOLIO_DISTRIBUTOR = getAddress("0xFc667eCE5db05bc2Cc771D05B416c96eA2500B49");

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

/** Contracts the agent wallet may touch. Used for Circle CLI allowlists. */
export function keeperAllowlist(): Address[] {
  const extra = treasuryAddress();
  const list = [ARC_USDC_ERC20, usycAddress(), keeperAddress(), x402PayTo()];
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
  const listed = new Set((args?.listedTickers ?? STOCKS.filter((s) => s.status === "live").map((s) => s.ticker)).map((t) => t.toUpperCase()));
  const listedWeight = STOCKS.filter((s) => listed.has(s.ticker)).reduce((n, s) => n + s.weight, 0);
  const queuedWeight = STOCKS.filter((s) => !listed.has(s.ticker)).reduce((n, s) => n + s.weight, 0);
  const cashSleeveBps = sleeveWeight("mmf") * 100;

  if (listedWeight === 0) {
    return {
      action: "park",
      reason: "Nothing listed yet. Fee USDC waits in the wallet.",
      cashSleeveBps,
      listedWeight,
      queuedWeight,
    };
  }
  if (queuedWeight > 0) {
    return {
      action: "buy",
      reason: `Buy the listed names. Keep ${cashSleeveBps / 100}% in USYC and BUIDL.`,
      cashSleeveBps,
      listedWeight,
      queuedWeight,
    };
  }
  return {
    action: "buy",
    reason: `Spend fee USDC on the book. Keep ${cashSleeveBps / 100}% in USYC and BUIDL.`,
    cashSleeveBps,
    listedWeight,
    queuedWeight,
  };
}

export function circleCliParkCommands(usdcAmount = "10") {
  const keeper = keeperAddress();
  const usyc = usycAddress();
  const treasury = treasuryAddress();
  return [
    `circle wallet list --type agent --chain ARC`,
    `circle wallet balance --address ${keeper} --chain ARC`,
    `circle wallet limit set --address ${keeper} --chain ARC --policy-type stablecoin --per-tx 500 --daily 5000`,
    `circle wallet swap --address ${keeper} --chain ARC --from ${ARC_USDC_ERC20} --to ${usyc} --amount ${usdcAmount}`,
    treasury
      ? `circle wallet execute --address ${keeper} --chain ARC --contract ${treasury} --fn depositCash --args ${usyc},${usdcAmount}`
      : `# deploy FolioTreasury then: circle wallet execute --contract $FOLIO_TREASURY --fn receiveFees`,
  ];
}

export const KEEPER_HOST = {
  name: "Jessica’s MacBook Air",
  ssh: "jessica-m1",
  tailscale: "jessicas-macbook-air.tailf9fd35.ts.net",
  launchd: "com.stonkfolio.keeper",
  path: "/Users/hectorhernandez/code/stonkfolio",
} as const;
