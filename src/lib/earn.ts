import { EarnChain, EarnKit } from "@circle-fin/earn-kit";

export type EarnVaultRow = {
  name: string;
  protocol: string;
  asset: string;
  vaultAddress: string;
  apy: number;
  status: string;
  circleGuarded: boolean;
  totalDeposits: string;
  liquidity: string;
};

let kit: EarnKit | null = null;

function getKit() {
  if (!kit) kit = new EarnKit();
  return kit;
}

export function earnChain(): (typeof EarnChain)[keyof typeof EarnChain] {
  return process.env.EARN_CHAIN === "Arc_Testnet" ? EarnChain.Arc_Testnet : EarnChain.Arc;
}

export async function exploreEarnVaults(): Promise<{
  ok: boolean;
  chain: string;
  vaults: EarnVaultRow[];
  reason?: string;
}> {
  const chain = earnChain();
  try {
    const result = await getKit().exploreVaults({
      chain,
      sortBy: "apy",
    });
    const vaults: EarnVaultRow[] = (result.vaults ?? [])
      .map((v) => ({
        name: v.name,
        protocol: String(v.protocol ?? "MORPHO"),
        asset: String(v.asset ?? "USDC"),
        vaultAddress: v.vaultAddress,
        apy: Number(v.currentApy ?? 0),
        status: String(v.status ?? "unknown"),
        circleGuarded: Boolean(v.circleGuarded),
        totalDeposits: String(v.totalDeposits ?? "0"),
        liquidity: String(v.liquidity ?? "0"),
      }))
      .filter((v) => !/\btest\b/i.test(v.name) && !/^pjv4$/i.test(v.name));
    return { ok: true, chain, vaults };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Earn Kit explore failed";
    return { ok: false, chain, vaults: [], reason };
  }
}
