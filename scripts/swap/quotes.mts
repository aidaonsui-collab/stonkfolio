// Read-only check of the route finder against Arc mainnet. Sends no transactions.
// Run: npx tsx scripts/swap/quotes.mts
import { SWAP_TOKENS, discoverPools, formatTokenAmount, makeSwapClient, parseAmount, quoteBest, routeLabel } from "../../src/lib/swap";

const client = makeSwapClient();
const t = (s: string) => SWAP_TOKENS.find((x) => x.symbol === s)!;
const chain = await client.getChainId();
if (chain !== 5042) throw new Error(`wrong chain ${chain}`);
const pools = await discoverPools(client, SWAP_TOKENS);
console.log(`pools with liquidity: ${pools.length}`);

const cases: [string, string, string][] = [
  ["USDC", "EURC", "10"],
  ["USDC", "WETH", "10"],
  ["USDC", "cirBTC", "10"],
  ["EURC", "cirBTC", "10"],
  ["cirBTC", "WETH", "0.0001"],
  ["WETH", "USDC", "0.001"],
];
let failed = 0;
for (const [a, b, amt] of cases) {
  const tin = t(a), tout = t(b);
  const amountIn = parseAmount(amt, tin.decimals)!;
  try {
    const q = await quoteBest(client, SWAP_TOKENS, tin.address, tout.address, amountIn);
    if (!q) throw new Error("no route");
    console.log(`${amt} ${a} -> ${formatTokenAmount(q.best.amountOut, tout.decimals, 8)} ${b} | ${routeLabel(q.best.route, SWAP_TOKENS)} | routes ${q.considered} | impact ${q.impactPct === null ? "n/a" : q.impactPct.toFixed(3) + "%"}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${amt} ${a} -> ${b}: ${(e as Error).message}`);
  }
}
process.exit(failed ? 1 : 0);
