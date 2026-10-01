import test from "node:test";
import assert from "node:assert/strict";
import { encodeFunctionData, getAddress } from "viem";
import {
  SWAP_TOKENS, buildSwapCalldata, buildSwapTx, encodePath, findRoutes, impactLevel, minReceived,
  parseAmount, parseSlippagePct, priceImpactPct, routeLabel, sameToken, toInputString, formatTokenAmount, friendlyError, SWAP_ROUTER, type Pool,
  UNIVERSAL_ROUTER, PERMIT2, V4_POOL_MANAGER, V4_QUOTER, V4_STATE_VIEW, buildV4SwapTx, buildPermit2ApproveTx, v4ApprovalStep, v4PoolKey, v4PoolId, sortCurrencies,
  routeVenue, universalRouterAbi,
} from "../../src/lib/swap";
import { decodeAbiParameters, decodeFunctionData } from "viem";

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

// ---------- Uniswap v4 (pure; no network, no transactions) ----------

const v4Pool = (a: typeof USDC, b: typeof USDC, fee: number, tickSpacing: number): Pool => ({
  a: a.address, b: b.address, fee, tickSpacing, pool: ME, liquidity: 1n, venue: "v4",
});

test("v4 addresses are the verified Arc deployment", () => {
  assert.equal(V4_POOL_MANAGER, getAddress("0x8366a39CC670B4001A1121B8F6A443A643e40951"));
  assert.equal(V4_QUOTER, getAddress("0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94"));
  assert.equal(V4_STATE_VIEW, getAddress("0xF3334192D15450CdD385c8B70e03f9A6bD9E673b"));
  assert.equal(UNIVERSAL_ROUTER, getAddress("0x4fcA4a51Ab4F23A7447b3284fBd7D73289A89Fb1"));
  assert.equal(PERMIT2, getAddress("0x000000000022D473030F116dDEE9F6B43aC78BA3"));
});

test("v4 pool key sorts currencies and has no hooks", () => {
  // USDC 0x3600.. sorts below EURC 0xbEf5..
  assert.deepEqual(sortCurrencies(EURC.address, USDC.address), [USDC.address, EURC.address]);
  const k = v4PoolKey(EURC.address, USDC.address, 500, 10);
  assert.equal(k.currency0, USDC.address);
  assert.equal(k.currency1, EURC.address);
  assert.equal(k.hooks, "0x0000000000000000000000000000000000000000");
  assert.match(v4PoolId(k), /^0x[0-9a-f]{64}$/);
  assert.notEqual(v4PoolId(k), v4PoolId(v4PoolKey(USDC.address, EURC.address, 500, 60)));
});

test("route finder keeps v3 and v4 apart; v4 is direct only", () => {
  const pools = [pool(USDC, EURC, 500), v4Pool(USDC, EURC, 500, 10), v4Pool(USDC, BTC, 100, 1), pool(WETH, USDC, 3000)];
  const direct = findRoutes(pools, SWAP_TOKENS, USDC.address, EURC.address);
  assert.deepEqual(direct.map((r) => routeVenue(r)).sort(), ["v3", "v4"]);
  assert.equal(direct.find((r) => routeVenue(r) === "v4")!.hops[0].tickSpacing, 10);
  // EURC -> BTC would need USDC as a middle: only a v4 USDC/BTC pool exists, and 2-hop never uses v4.
  assert.equal(findRoutes(pools, SWAP_TOKENS, EURC.address, BTC.address).length, 0);
  // With no v4 pools the result is identical to v3-only.
  const v3only = findRoutes([pool(USDC, EURC, 500)], SWAP_TOKENS, USDC.address, EURC.address);
  assert.equal(v3only.length, 1);
  assert.equal(routeVenue(v3only[0]), "v3");
});

test("v4 swap tx: Universal Router execute(V4_SWAP) with SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL", () => {
  const route = { venue: "v4" as const, hops: [{ tokenIn: EURC.address, tokenOut: USDC.address, fee: 500, tickSpacing: 10 }] };
  const tx = buildV4SwapTx({ route, amountIn: 5_000_000n, minOut: 4_900_000n, nowSec: 1_000 });
  assert.equal(tx.address, UNIVERSAL_ROUTER);
  assert.equal(tx.functionName, "execute");
  assert.equal(tx.args[0], "0x10");
  assert.equal(tx.args[2], 1_000n + 1_200n);
  // Round-trip the calldata the way the router will read it.
  const data = encodeFunctionData({ abi: universalRouterAbi, functionName: "execute", args: [...tx.args] });
  const dec = decodeFunctionData({ abi: universalRouterAbi, data });
  const [actions, params] = decodeAbiParameters([{ type: "bytes" }, { type: "bytes[]" }], (dec.args as readonly [string, readonly `0x${string}`[], bigint])[1][0]);
  assert.equal(actions, "0x060c0f");
  assert.equal(params.length, 3);
  const [swap] = decodeAbiParameters(
    [{ type: "tuple", components: [
      { name: "poolKey", type: "tuple", components: [
        { name: "currency0", type: "address" }, { name: "currency1", type: "address" }, { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" }, { name: "hooks", type: "address" } ] },
      { name: "zeroForOne", type: "bool" }, { name: "amountIn", type: "uint128" }, { name: "amountOutMinimum", type: "uint128" }, { name: "hookData", type: "bytes" } ] }],
    params[0],
  );
  assert.equal(swap.poolKey.currency0, USDC.address);
  assert.equal(swap.poolKey.currency1, EURC.address);
  assert.equal(swap.zeroForOne, false); // EURC (currency1) in
  assert.equal(swap.amountIn, 5_000_000n);
  assert.equal(swap.amountOutMinimum, 4_900_000n);
  // SETTLE_ALL pays the input currency up to amountIn; TAKE_ALL takes the output currency with the min.
  assert.deepEqual(decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[1]), [EURC.address, 5_000_000n]);
  assert.deepEqual(decodeAbiParameters([{ type: "address" }, { type: "uint256" }], params[2]), [USDC.address, 4_900_000n]);
  // zeroForOne direction
  const fwd = buildV4SwapTx({ route: { venue: "v4", hops: [{ tokenIn: USDC.address, tokenOut: EURC.address, fee: 500, tickSpacing: 10 }] }, amountIn: 1n, minOut: 1n, nowSec: 0 });
  const fp = decodeAbiParameters([{ type: "bytes" }, { type: "bytes[]" }], fwd.args[1][0])[1];
  assert.deepEqual(decodeAbiParameters([{ type: "address" }, { type: "uint256" }], fp[1]), [USDC.address, 1n]);
  // guards
  assert.throws(() => buildV4SwapTx({ route: { hops: route.hops }, amountIn: 1n, minOut: 1n }));
  assert.throws(() => buildV4SwapTx({ route, amountIn: 0n, minOut: 1n }));
  assert.throws(() => buildV4SwapTx({ route, amountIn: 1n, minOut: 0n }));
});

test("permit2 approval is exact amount with a short expiry to the Universal Router", () => {
  const tx = buildPermit2ApproveTx({ token: USDC.address, amountIn: 7_000_000n, nowSec: 10_000 });
  assert.equal(tx.address, PERMIT2);
  assert.deepEqual(tx.args, [USDC.address, UNIVERSAL_ROUTER, 7_000_000n, 10_000 + 1_800]);
  assert.throws(() => buildPermit2ApproveTx({ token: USDC.address, amountIn: 0n }));
});

test("v4 approval steps: ERC-20 to Permit2 first, then Permit2 to the router", () => {
  const now = 1_000_000;
  const base = { amountIn: 100n, nowSec: now };
  assert.equal(v4ApprovalStep({ ...base, erc20ToPermit2: 0n, permit2Amount: 0n, permit2Expiration: 0 }), "erc20");
  assert.equal(v4ApprovalStep({ ...base, erc20ToPermit2: 100n, permit2Amount: 0n, permit2Expiration: 0 }), "permit2");
  assert.equal(v4ApprovalStep({ ...base, erc20ToPermit2: 100n, permit2Amount: 100n, permit2Expiration: now + 100 }), "permit2");
  assert.equal(v4ApprovalStep({ ...base, erc20ToPermit2: 100n, permit2Amount: 99n, permit2Expiration: now + 1000 }), "permit2");
  assert.equal(v4ApprovalStep({ ...base, erc20ToPermit2: 100n, permit2Amount: 100n, permit2Expiration: now + 1000 }), null);
});
