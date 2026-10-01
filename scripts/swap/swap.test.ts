import test from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "viem";
import {
  SWAP_TOKENS, buildSwapCalldata, buildSwapTx, encodePath, findRoutes, impactLevel, minReceived,
  parseAmount, parseSlippagePct, priceImpactPct, routeLabel, sameToken, toInputString, formatTokenAmount, friendlyError, SWAP_ROUTER, type Pool,
} from "../../src/lib/swap";

const [USDC, EURC, BTC, WETH] = SWAP_TOKENS;
const ME = getAddress("0x00000000000000000000000000000000000000a1");

test("parseAmount respects decimals and rejects junk", () => {
  assert.equal(parseAmount("10", 6), 10_000_000n);
  assert.equal(parseAmount("0.5", 6), 500_000n);
  assert.equal(parseAmount(".5", 6), 500_000n);
  assert.equal(parseAmount("0.1234567", 6), null);
  assert.equal(parseAmount("0", 6), null);
  assert.equal(parseAmount("", 6), null);
  assert.equal(parseAmount("1e5", 6), null);
  assert.equal(parseAmount("-1", 6), null);
  assert.equal(parseAmount("0.00000001", 8), 1n);
});

test("minReceived applies slippage in bps", () => {
  assert.equal(minReceived(1_000_000n, 100), 990_000n);
  assert.equal(minReceived(1_000_000n, 50), 995_000n);
  assert.equal(minReceived(1_000_000n, 0), 1_000_000n);
});

test("slippage parsing bounds", () => {
  assert.equal(parseSlippagePct("1"), 100);
  assert.equal(parseSlippagePct("0.5"), 50);
  assert.equal(parseSlippagePct("0"), null);
  assert.equal(parseSlippagePct("51"), null);
  assert.equal(parseSlippagePct("abc"), null);
});

test("path encoding is token,fee,token(,fee,token)", () => {
  const p = encodePath([USDC.address, EURC.address], [500]);
  assert.equal(p.length, 2 + (20 + 3 + 20) * 2);
  assert.ok(p.startsWith("0x3600000000000000000000000000000000000000" + "0001f4"));
  const p2 = encodePath([EURC.address, USDC.address, BTC.address], [500, 100]);
  assert.equal(p2.length, 2 + (20 + 3 + 20 + 3 + 20) * 2);
  assert.throws(() => encodePath([USDC.address], []));
});

test("price impact math", () => {
  assert.ok(Math.abs((priceImpactPct(1_000_000n, 990_000n, 1_000n, 1_000n) ?? 0) - 1) < 0.01);
  assert.equal(priceImpactPct(1_000_000n, 1_010_000n, 1_000n, 1_000n), 0);
  assert.equal(priceImpactPct(0n, 1n, 1n, 1n), null);
  assert.equal(impactLevel(1), "ok");
  assert.equal(impactLevel(2.5), "warn");
  assert.equal(impactLevel(5.1), "confirm");
  assert.equal(impactLevel(null), "ok");
});

const pool = (a: typeof USDC, b: typeof USDC, fee: number): Pool => ({ a: a.address, b: b.address, fee, pool: ME, liquidity: 1n });

test("route finder: direct, 2-hop via hub, none when no pools", () => {
  const pools = [pool(USDC, EURC, 500), pool(USDC, EURC, 3000), pool(USDC, BTC, 100), pool(WETH, BTC, 3000), pool(USDC, WETH, 3000)];
  const direct = findRoutes(pools, SWAP_TOKENS, USDC.address, EURC.address);
  assert.deepEqual(direct.filter((r) => r.hops.length === 1).map((r) => r.hops[0].fee).sort((a, b) => a - b), [500, 3000]);
  const eb = findRoutes(pools, SWAP_TOKENS, EURC.address, BTC.address);
  assert.ok(eb.length >= 2 && eb.every((r) => r.hops.length === 2));
  assert.ok(eb.some((r) => r.hops[0].tokenOut === USDC.address && r.hops[0].fee === 500 && r.hops[1].fee === 100));
  assert.equal(findRoutes([], SWAP_TOKENS, EURC.address, BTC.address).length, 0);
  assert.match(routeLabel(eb[0], SWAP_TOKENS), /EURC → USDC → cirBTC/);
});

test("swap calldata: recipient is wallet, multicall deadline is 20 minutes", () => {
  const route = { hops: [{ tokenIn: USDC.address, tokenOut: EURC.address, fee: 500 }] };
  const tx = buildSwapTx({ route, amountIn: 10_000_000n, minOut: 9_000_000n, recipient: ME, nowSec: 1_000 });
  assert.equal(tx.address, SWAP_ROUTER);
  assert.equal(tx.args[0], 1_000n + 1_200n);
  const inner = buildSwapCalldata({ route, amountIn: 10_000_000n, minOut: 9_000_000n, recipient: ME });
  assert.equal(tx.args[1][0], inner);
  assert.ok(inner.startsWith("0x04e45aaf"));
  assert.ok(inner.toLowerCase().includes(ME.slice(2).toLowerCase()));
  const two = buildSwapCalldata({ route: { hops: [route.hops[0], { tokenIn: EURC.address, tokenOut: BTC.address, fee: 100 }] }, amountIn: 1n, minOut: 1n, recipient: ME });
  assert.ok(two.startsWith("0xb858183f"));
  assert.throws(() => buildSwapCalldata({ route, amountIn: 1n, minOut: 1n, recipient: "0x0000000000000000000000000000000000000000" }));
});

test("misc helpers", () => {
  assert.ok(sameToken(USDC, { address: USDC.address.toLowerCase() }));
  assert.ok(!sameToken(USDC, EURC));
  assert.equal(toInputString(1_500_000n, 6), "1.5");
  assert.equal(toInputString(2_000_000n, 6), "2");
  assert.equal(formatTokenAmount(0n, 6), "0");
  assert.equal(formatTokenAmount(1_234_567n, 6), "1.234567");
  assert.match(friendlyError(new Error("HTTP 429 Too Many Requests")), /busy/);
  assert.match(friendlyError({ code: 4001, message: "x" }), /cancelled/);
});
