import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { arc, ARC_CHAIN_ID } from "./chain";

export const wagmiConfig = createConfig({
  chains: [arc],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [ARC_CHAIN_ID]: http(undefined, { batch: true }),
  },
  ssr: true,
});

export async function addOrSwitchArc() {
  const eth = window.ethereum;
  if (!eth?.request) throw new Error("No injected wallet");
  const hexId = `0x${ARC_CHAIN_ID.toString(16)}`;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 4902 && code !== -32603) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexId,
          chainName: "Arc",
          nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
          rpcUrls: ["https://rpc.arc-scan.org", "https://arc-mainnet-rpc.baracat.meme"],
          blockExplorerUrls: ["https://arc-scan.org"],
        },
      ],
    });
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}
