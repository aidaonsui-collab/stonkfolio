// Read-only checks against Arc mainnet (eth_call / eth_getCode only; no transactions, no wallet).
// Run: npm run test:swap:live   Needs network; the RPC rate-limits, so calls retry inside the library.
import test from "node:test";
import assert from "node:assert/strict";
import {
  PERMIT2, SWAP_TOKENS, UNIVERSAL_ROUTER, V4_POOL_MANAGER, V4_QUOTER, V4_STATE_VIEW,
  discoverPoolsV4, findRoutes, makeSwapClient, parseAmount, quoteBest, quoteRoutes, routeVenue,
} from "../../src/lib/swap";

const client = makeSwapClient();
const [USDC, EURC] = SWAP_TOKENS;
const pmAbi = [{ type: "function", name: "poolManager", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const;

test("v4 contracts have code and point at the same PoolManager", async () => {
  for (const a of [V4_POOL_MANAGER, V4_QUOTER, V4_STATE_VIEW, UNIVERSAL_ROUTER, PERMIT2]) {
    const code = await client.getCode({ address: a });
    assert.ok(code && code !== "0x", `no code at ${a}`);
  }
  for (const a of [V4_QUOTER, V4_STATE_VIEW, UNIVERSAL_ROUTER]) {
    const pm = await client.readContract({ address: a, abi: pmAbi, functionName: "poolManager" });
    assert.equal(pm, V4_POOL_MANAGER);
  }
});

test("v4 discovery finds the USDC/EURC pool and V4Quoter quotes both directions", async () => {
  const pools = await discoverPoolsV4(client, SWAP_TOKENS);
  assert.ok(pools.some((p) => p.fee === 500 && p.tickSpacing === 10), "USDC/EURC 0.05% pool missing");
  for (const [tin, tout] of [[USDC, EURC], [EURC, USDC]]) {
    const amountIn = parseAmount("1", 6)!;
    const routes = findRoutes(pools, SWAP_TOKENS, tin.address, tout.address).filter((r) => routeVenue(r) === "v4");
    assert.ok(routes.length > 0);
    const quotes = await quoteRoutes(client, routes, amountIn);
    assert.ok(quotes.length > 0);
    // Stable pair: 1 unit should be worth roughly 0.8 to 1.3 of the other.
    const out = Number(quotes[0].amountOut) / 1e6;
    assert.ok(out > 0.8 && out < 1.3, `odd quote ${out}`);
  }
});

test("quoteBest compares v3 and v4 and reports the venue", async () => {
  const q = await quoteBest(client, SWAP_TOKENS, USDC.address, EURC.address, parseAmount("10", 6)!);
  assert.ok(q);
  assert.ok(q.venue === "v3" || q.venue === "v4");
  const cands = [q.bestV3, q.bestV4].filter((x) => x !== null);
  assert.ok(cands.length > 0);
  assert.equal(q.best.amountOut, cands.reduce((m, x) => (x!.amountOut > m ? x!.amountOut : m), 0n));
});
