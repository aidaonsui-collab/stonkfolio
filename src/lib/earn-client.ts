"use client";

import type { EIP1193Provider } from "viem";
import type { Connector } from "wagmi";
import { EarnChain, EarnKit } from "@circle-fin/earn-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

let kit: EarnKit | null = null;
function getKit() {
  if (!kit) kit = new EarnKit();
  return kit;
}

async function adapterFrom(connector: Connector) {
  const provider = (await connector.getProvider()) as EIP1193Provider;
  return createViemAdapterFromProvider({ provider });
}

export type VaultPosition = {
  vaultName: string;
  asset: string;
  balance: number;
  apy: number;
};

/** User-signed deposit: wallet -> vault, direct. The keeper never touches this. */
export async function depositToVault(connector: Connector, vaultAddress: string, amount: string) {
  const adapter = await adapterFrom(connector);
  return getKit().deposit({ from: { adapter, chain: EarnChain.Arc }, vaultAddress, amount });
}

export async function withdrawFromVault(connector: Connector, vaultAddress: string, amount: string) {
  const adapter = await adapterFrom(connector);
  return getKit().withdraw({ from: { adapter, chain: EarnChain.Arc }, vaultAddress, amount });
}

export async function getVaultPosition(connector: Connector, vaultAddress: string): Promise<VaultPosition | null> {
  try {
    const adapter = await adapterFrom(connector);
    const pos = await getKit().getPosition({ from: { adapter, chain: EarnChain.Arc }, vaultAddress });
    return {
      vaultName: pos.vaultName,
      asset: pos.asset,
      balance: Number(pos.currentBalance),
      apy: pos.currentApy,
    };
  } catch {
    return null;
  }
}
