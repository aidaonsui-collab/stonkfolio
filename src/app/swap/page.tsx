import type { Metadata } from "next";
import { SwapView } from "@/components/swap-view";

export const metadata: Metadata = {
  title: "Swap",
  description: "Swap USDC, EURC, cirBTC and WETH on Arc through Uniswap v3 and v4, straight from your own wallet.",
};

export default function Page() {
  return <SwapView />;
}
