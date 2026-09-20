import { EarnChain, EarnKit } from "@circle-fin/earn-kit";
import { arcStableAddress } from "./chain";

export type EarnVaultRow = {
  name: string;
  protocol: string;
  asset: string;
  assetAddress: string;
  vaultAddress: string;
  apy: number;
  status: string;
  circleGuarded: boolean;
  totalDeposits: string;
  liquidity: string;
  depositable: boolean;
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
    const seen = new Set<string>();
    const vaults: EarnVaultRow[] = [];
    for (const v of result.vaults ?? []) {
      const vaultAddress = v.vaultAddress;
      if (!vaultAddress || seen.has(vaultAddress.toLowerCase())) continue;
      if (/\btest\b/i.test(v.name) || /^pjv4$/i.test(v.name)) continue;
      seen.add(vaultAddress.toLowerCase());
      const asset = String(v.asset ?? "USDC");
      const assetAddress = (v.assetAddress && /^0x[a-fA-F0-9]{40}$/.test(v.assetAddress)
        ? v.assetAddress
        : arcStableAddress(asset) ?? "") as string;
      const status = String(v.status ?? "unknown");
      vaults.push({
        name: v.name,
        protocol: String(v.protocol ?? "MORPHO"),
        asset,
        assetAddress,
        vaultAddress,
        apy: Number(v.currentApy ?? 0),
        status,
        circleGuarded: Boolean(v.circleGuarded),
        totalDeposits: String(v.totalDeposits ?? "0"),
        liquidity: String(v.liquidity ?? "0"),
        depositable: status === "active" && Boolean(arcStableAddress(asset) && assetAddress),
      });
    }
    return { ok: true, chain, vaults };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Earn Kit explore failed";
    return { ok: false, chain, vaults: [], reason };
  }
}
