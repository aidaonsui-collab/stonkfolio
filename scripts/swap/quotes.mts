// Read-only check of the route finder against Arc mainnet. Sends no transactions.
// Run: npx tsx scripts/swap/quotes.mts
import { SWAP_TOKENS, discoverPools, discoverPoolsV4, findRoutes, quoteRoutes, routeVenue, VENUE_LABEL, formatTokenAmount, makeSwapClient, parseAmount, quoteBest, routeLabel } from "../../src/lib/swap";

const client = makeSwapClient();
const t = (s: string) => SWAP_TOKENS.find((x) => x.symbol === s)!;
const chain = await client.getChainId();
if (chain !== 5042) throw new Error(`wrong chain ${chain}`);
const pools = await discoverPools(client, SWAP_TOKENS);
console.log(`v3 pools with liquidity: ${pools.length}`);
const poolsV4 = await discoverPoolsV4(client, SWAP_TOKENS);
console.log(`v4 pools with liquidity: ${poolsV4.length}`);
for (const p of poolsV4) {
  const sym = (a: string) => SWAP_TOKENS.find((x) => x.address === a)!.symbol;
  console.log(`  v4 ${sym(p.a)}/${sym(p.b)} fee ${p.fee} tickSpacing ${p.tickSpacing} liquidity ${p.liquidity}`);
}
// Read-only: every v4 pool must quote through V4Quoter in both directions (eth_call, nothing is sent).
for (const p of poolsV4) {
  const a = SWAP_TOKENS.find((x) => x.address === p.a)!, b = SWAP_TOKENS.find((x) => x.address === p.b)!;
  for (const [tin, tout] of [[a, b], [b, a]]) {
    const amountIn = parseAmount(tin.decimals === 18 ? "0.001" : tin.decimals === 8 ? "0.0001" : "1", tin.decimals)!;
    const r = findRoutes(poolsV4, SWAP_TOKENS, tin.address, tout.address).filter((x) => routeVenue(x) === "v4" && x.hops[0].fee === p.fee);
    const [qt] = await quoteRoutes(client, r, amountIn);
    console.log(`  v4 quote ${formatTokenAmount(amountIn, tin.decimals)} ${tin.symbol} -> ${qt ? formatTokenAmount(qt.amountOut, tout.decimals, 8) : "none"} ${tout.symbol}`);
  }
}

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
    console.log(`${amt} ${a} -> ${formatTokenAmount(q.best.amountOut, tout.decimals, 8)} ${b} | ${routeLabel(q.best.route, SWAP_TOKENS)} | ${VENUE_LABEL[q.venue]} | v3 ${q.bestV3 ? formatTokenAmount(q.bestV3.amountOut, tout.decimals, 8) : "-"} v4 ${q.bestV4 ? formatTokenAmount(q.bestV4.amountOut, tout.decimals, 8) : "-"} | routes ${q.considered} | impact ${q.impactPct === null ? "n/a" : q.impactPct.toFixed(3) + "%"}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${amt} ${a} -> ${b}: ${(e as Error).message}`);
  }
}
process.exit(failed ? 1 : 0);
