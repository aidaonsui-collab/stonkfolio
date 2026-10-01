import {
  createPublicClient,
  defineChain,
  encodeFunctionData,
  encodePacked,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  parseUnits,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";

/**
 * Swap on Arc (5042) through Uniswap v3. Stonkfolio takes no fee and never holds funds:
 * the user's wallet signs approve + swap straight to SwapRouter02 with itself as recipient.
 * This file only depends on viem so the pure helpers can be tested from node.
 */

export const ARC_CHAIN = 5042;
export const SWAP_RPC = "https://rpc.mainnet.arc.io";

/** Verified on Arc with eth_getCode and the expected selectors, 2026-10-01. */
export const V3_FACTORY = getAddress("0xf0db7b58379503491d857dB50AC9ece64c653918");
export const SWAP_ROUTER = getAddress("0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77");
export const QUOTER_V2 = getAddress("0x7DfD4F31be6814D2906BDE155c3e1B146EAc1468");
export const MULTICALL3 = getAddress("0xcA11bde05977b3631167028862bE2a173976CA11");

export const FEE_TIERS = [100, 500, 3000, 10000] as const;
export const DEADLINE_SECONDS = 20 * 60;
export const DEFAULT_SLIPPAGE_BPS = 100;
export const IMPACT_WARN_PCT = 2;
export const IMPACT_CONFIRM_PCT = 5;

export type SwapToken = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  color: string;
  /** Hub tokens may be used as the middle of a 2-hop route. */
  hub: boolean;
};

/** ERC-20 interface addresses. USDC is the 6-decimal ERC-20 view, never the 18-decimal native balance. */
export const SWAP_TOKENS: readonly SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", address: getAddress("0x3600000000000000000000000000000000000000"), decimals: 6, color: "#2775ca", hub: true },
  { symbol: "EURC", name: "Euro Coin", address: getAddress("0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1"), decimals: 6, color: "#3d7eff", hub: true },
  { symbol: "cirBTC", name: "Circle Wrapped Bitcoin", address: getAddress("0x171A4217b86A807A64eB94757Db6849fb4bDbAA0"), decimals: 8, color: "#f7931a", hub: true },
  { symbol: "WETH", name: "Wrapped Ether", address: getAddress("0x128cC466B61f542da60c70e3aA11c10e19B84EDB"), decimals: 18, color: "#627eea", hub: true },
];

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

export const factoryAbi = parseAbi(["function getPool(address,address,uint24) view returns (address)"]);
export const poolAbi = parseAbi(["function liquidity() view returns (uint128)"]);

/** QuoterV2 (struct form). */
export const quoterAbi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "quoteExactInput",
    stateMutability: "nonpayable",
    inputs: [
      { name: "path", type: "bytes" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { name: "initializedTicksCrossedList", type: "uint32[]" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

/** SwapRouter02. It has no deadline field, so the swap goes through multicall(deadline, data[]). */
export const routerAbi = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "exactInput",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "path", type: "bytes" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "multicall",
    stateMutability: "payable",
    inputs: [
      { name: "deadline", type: "uint256" },
      { name: "data", type: "bytes[]" },
    ],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

export const arcSwapChain = defineChain({
  id: ARC_CHAIN,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [SWAP_RPC] } },
  contracts: { multicall3: { address: MULTICALL3 } },
});

export function makeSwapClient(): PublicClient {
  return createPublicClient({ chain: arcSwapChain, transport: http(SWAP_RPC, { batch: true }) }) as PublicClient;
}

// ---------- pure helpers ----------

const ZERO = "0x0000000000000000000000000000000000000000";

export function sameToken(a: { address: string } | null | undefined, b: { address: string } | null | undefined) {
  return Boolean(a && b && a.address.toLowerCase() === b.address.toLowerCase());
}

/** Parses a typed decimal string. Null when empty, malformed, zero, or more precise than the token. */
export function parseAmount(input: string, decimals: number): bigint | null {
  const s = input.trim();
  if (!s || !/^\d*\.?\d*$/.test(s) || s === ".") return null;
  const frac = s.split(".")[1] ?? "";
  if (frac.length > decimals) return null;
  try {
    const v = parseUnits(s.startsWith(".") ? `0${s}` : s, decimals);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

/** True when the string has more fraction digits than the token allows. */
export function tooPrecise(input: string, decimals: number) {
  return (input.split(".")[1] ?? "").length > decimals;
}

export function formatTokenAmount(raw: bigint, decimals: number, maxFrac = 6): string {
  const full = formatUnits(raw, decimals);
  const [whole, frac = ""] = full.split(".");
  const w = BigInt(whole).toLocaleString("en-US");
  if (raw === 0n) return "0";
  let f = frac.slice(0, maxFrac).replace(/0+$/, "");
  if (!f && BigInt(whole) === 0n) {
    // Smaller than maxFrac digits can show.
    return `<${(10 ** -maxFrac).toFixed(maxFrac)}`;
  }
  if (BigInt(whole) >= 1000n) f = f.slice(0, 2);
  return f ? `${w}.${f}` : w;
}

/** Plain decimal string for an input box (no grouping, no trailing zeros). */
export function toInputString(raw: bigint, decimals: number): string {
  const full = formatUnits(raw, decimals);
  return full.includes(".") ? full.replace(/0+$/, "").replace(/\.$/, "") : full;
}

export function minReceived(amountOut: bigint, slippageBps: number): bigint {
  const bps = BigInt(Math.max(0, Math.min(10_000, Math.round(slippageBps))));
  return (amountOut * (10_000n - bps)) / 10_000n;
}

/** Parses a slippage percent like "0.5" into bps. Null if out of the allowed 0.01% to 50% range. */
export function parseSlippagePct(input: string): number | null {
  const s = input.trim();
  if (!/^\d*\.?\d*$/.test(s) || !s || s === ".") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0.01 || n > 50) return null;
  return Math.round(n * 100);
}

export function encodePath(tokens: readonly Address[], fees: readonly number[]): Hex {
  if (tokens.length < 2 || fees.length !== tokens.length - 1) throw new Error("bad path");
  const types: ("address" | "uint24")[] = [];
  const values: (Address | number)[] = [];
  tokens.forEach((t, i) => {
    types.push("address");
    values.push(t);
    if (i < fees.length) {
      types.push("uint24");
      values.push(fees[i]);
    }
  });
  return encodePacked(types, values);
}

export type RouteHop = { tokenIn: Address; tokenOut: Address; fee: number };
export type Route = { hops: RouteHop[] };

export function routeTokens(route: Route): Address[] {
  return [route.hops[0].tokenIn, ...route.hops.map((h) => h.tokenOut)];
}

export function routeLabel(route: Route, tokens: readonly SwapToken[]): string {
  const sym = (a: string) => tokens.find((t) => t.address.toLowerCase() === a.toLowerCase())?.symbol ?? "?";
  const path = routeTokens(route).map(sym).join(" → ");
  const fees = route.hops.map((h) => `${h.fee / 10_000}%`).join(" + ");
  return `${path} (${fees} fee${route.hops.length > 1 ? "s" : ""})`;
}

/** Positive number = worse than the small-trade price. */
export function priceImpactPct(amountIn: bigint, amountOut: bigint, refIn: bigint, refOut: bigint): number | null {
  if (amountIn <= 0n || amountOut <= 0n || refIn <= 0n || refOut <= 0n) return null;
  // out/in vs refOut/refIn, in basis points of a percent to keep integer math.
  const num = amountOut * refIn * 1_000_000n;
  const den = amountIn * refOut;
  const ratioMicro = Number(num / den) / 1_000_000;
  return Math.max(0, (1 - ratioMicro) * 100);
}

export function impactLevel(pct: number | null): "ok" | "warn" | "confirm" {
  if (pct === null) return "ok";
  if (pct > IMPACT_CONFIRM_PCT) return "confirm";
  if (pct > IMPACT_WARN_PCT) return "warn";
  return "ok";
}

export function isRateLimit(err: unknown): boolean {
  const m = String((err as { message?: string; shortMessage?: string })?.message ?? err).toLowerCase();
  return m.includes("429") || m.includes("rate limit") || m.includes("too many requests") || m.includes("over rate");
}

export function friendlyError(err: unknown): string {
  if (isRateLimit(err)) return "The Arc RPC is busy. Wait a few seconds and try again.";
  const e = err as { code?: number; shortMessage?: string; message?: string; cause?: { code?: number } };
  const m = (e?.shortMessage ?? e?.message ?? "").toLowerCase();
  if (e?.code === 4001 || e?.cause?.code === 4001 || m.includes("user rejected") || m.includes("user denied")) {
    return "Transaction cancelled in your wallet.";
  }
  if (m.includes("insufficient funds") || m.includes("gas")) {
    return "Not enough USDC for network gas on Arc.";
  }
  if (m.includes("too little received") || m.includes("stf")) {
    return "Price moved beyond your slippage limit. Try again or raise slippage.";
  }
  return e?.shortMessage ?? e?.message?.split("\n")[0] ?? "Something went wrong.";
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isRateLimit(err) || i === tries - 1) break;
      await new Promise((r) => setTimeout(r, 600 * 2 ** i));
    }
  }
  throw last;
}

// ---------- pool discovery and routing ----------

export type Pool = { a: Address; b: Address; fee: number; pool: Address; liquidity: bigint };

const poolCache = new Map<string, Promise<Pool[]>>();

function pairsFor(tokens: readonly SwapToken[]): [SwapToken, SwapToken][] {
  const out: [SwapToken, SwapToken][] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      // Skip pairs where neither side is a hub: they would only add RPC load.
      if (!tokens[i].hub && !tokens[j].hub) continue;
      out.push([tokens[i], tokens[j]]);
    }
  }
  return out;
}

/** Finds every V3 pool with in-range liquidity between the tokens. Cached per token set. */
export function discoverPools(client: PublicClient, tokens: readonly SwapToken[]): Promise<Pool[]> {
  const key = tokens.map((t) => t.address.toLowerCase()).sort().join(",");
  const hit = poolCache.get(key);
  if (hit) return hit;
  const run = (async () => {
    const combos = pairsFor(tokens).flatMap(([a, b]) => FEE_TIERS.map((fee) => ({ a, b, fee })));
    const pools = await withRetry(() =>
      client.multicall({
        multicallAddress: MULTICALL3,
        allowFailure: true,
        contracts: combos.map((c) => ({
          address: V3_FACTORY,
          abi: factoryAbi,
          functionName: "getPool" as const,
          args: [c.a.address, c.b.address, c.fee] as const,
        })),
      }),
    );
    const found = combos
      .map((c, i) => ({ ...c, pool: pools[i].status === "success" ? (pools[i].result as Address) : ZERO }))
      .filter((c) => c.pool !== ZERO);
    if (!found.length) return [];
    const liq = await withRetry(() =>
      client.multicall({
        multicallAddress: MULTICALL3,
        allowFailure: true,
        contracts: found.map((c) => ({ address: c.pool as Address, abi: poolAbi, functionName: "liquidity" as const })),
      }),
    );
    return found
      .map((c, i) => ({
        a: c.a.address,
        b: c.b.address,
        fee: c.fee,
        pool: c.pool as Address,
        liquidity: liq[i].status === "success" ? (liq[i].result as bigint) : 0n,
      }))
      .filter((p) => p.liquidity > 0n);
  })();
  poolCache.set(key, run);
  run.catch(() => poolCache.delete(key));
  return run;
}

export function clearPoolCache() {
  poolCache.clear();
}

/** Direct routes and 2-hop routes through a hub token, over pools that have liquidity. */
export function findRoutes(pools: readonly Pool[], tokens: readonly SwapToken[], tokenIn: Address, tokenOut: Address, max = 40): Route[] {
  const eq = (x: string, y: string) => x.toLowerCase() === y.toLowerCase();
  const edge = (from: Address, to: Address) =>
    pools.filter((p) => (eq(p.a, from) && eq(p.b, to)) || (eq(p.a, to) && eq(p.b, from)));
  const routes: Route[] = [];
  for (const p of edge(tokenIn, tokenOut)) {
    routes.push({ hops: [{ tokenIn, tokenOut, fee: p.fee }] });
  }
  for (const mid of tokens.filter((t) => t.hub)) {
    if (eq(mid.address, tokenIn) || eq(mid.address, tokenOut)) continue;
    const first = edge(tokenIn, mid.address);
    const second = edge(mid.address, tokenOut);
    for (const f of first) {
      for (const s of second) {
        routes.push({
          hops: [
            { tokenIn, tokenOut: mid.address, fee: f.fee },
            { tokenIn: mid.address, tokenOut, fee: s.fee },
          ],
        });
      }
    }
  }
  return routes.slice(0, max);
}

export type RouteQuote = { route: Route; amountOut: bigint; gasEstimate: bigint };

function quoteCall(route: Route, amountIn: bigint) {
  if (route.hops.length === 1) {
    const h = route.hops[0];
    return {
      address: QUOTER_V2,
      abi: quoterAbi,
      functionName: "quoteExactInputSingle" as const,
      args: [{ tokenIn: h.tokenIn, tokenOut: h.tokenOut, amountIn, fee: h.fee, sqrtPriceLimitX96: 0n }] as const,
    };
  }
  const path = encodePath(routeTokens(route), route.hops.map((h) => h.fee));
  return { address: QUOTER_V2, abi: quoterAbi, functionName: "quoteExactInput" as const, args: [path, amountIn] as const };
}

/** Quotes every route in one batched call. Routes whose quote reverts (no usable pool) are dropped. */
export async function quoteRoutes(client: PublicClient, routes: readonly Route[], amountIn: bigint): Promise<RouteQuote[]> {
  if (!routes.length) return [];
  const calls = routes.map((r) => quoteCall(r, amountIn));
  const results = (await withRetry(() =>
    client.multicall({
      multicallAddress: MULTICALL3,
      allowFailure: true,
      // Single and multi-hop calls have different arg shapes; the quoter ABI accepts both.
      contracts: calls as never,
    }),
  )) as { status: "success" | "failure"; result?: unknown }[];
  const out: RouteQuote[] = [];
  results.forEach((r, i) => {
    if (r.status !== "success") return;
    const tuple = r.result as readonly unknown[];
    const amountOut = tuple[0] as bigint;
    const gasEstimate = tuple[tuple.length - 1] as bigint;
    if (typeof amountOut === "bigint" && amountOut > 0n) out.push({ route: routes[i], amountOut, gasEstimate });
  });
  return out;
}

export type BestQuote = {
  amountIn: bigint;
  best: RouteQuote;
  considered: number;
  /** Percent worse than a small-trade quote on the same route. Null when it cannot be measured. */
  impactPct: number | null;
};

/** Finds the route with the highest output and measures price impact against a small trade. */
export async function quoteBest(
  client: PublicClient,
  tokens: readonly SwapToken[],
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<BestQuote | null> {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase() || amountIn <= 0n) return null;
  const pools = await discoverPools(client, tokens);
  const routes = findRoutes(pools, tokens, tokenIn, tokenOut);
  const quotes = await quoteRoutes(client, routes, amountIn);
  if (!quotes.length) return null;
  const best = quotes.reduce((a, b) => (b.amountOut > a.amountOut ? b : a));
  let impactPct: number | null = null;
  for (const div of [1000n, 100n, 10n]) {
    const refIn = amountIn / div;
    if (refIn <= 0n) continue;
    const [ref] = await quoteRoutes(client, [best.route], refIn);
    // Need enough output digits for the ratio to mean something.
    if (ref && ref.amountOut >= 1_000n) {
      impactPct = priceImpactPct(amountIn, best.amountOut, refIn, ref.amountOut);
      break;
    }
  }
  return { amountIn, best, considered: quotes.length, impactPct };
}

// ---------- transaction building ----------

export function buildSwapCalldata(args: { route: Route; amountIn: bigint; minOut: bigint; recipient: Address }): Hex {
  const { route, amountIn, minOut, recipient } = args;
  if (recipient.toLowerCase() === ZERO) throw new Error("recipient required");
  if (route.hops.length === 1) {
    const h = route.hops[0];
    return encodeFunctionData({
      abi: routerAbi,
      functionName: "exactInputSingle",
      args: [{ tokenIn: h.tokenIn, tokenOut: h.tokenOut, fee: h.fee, recipient, amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: 0n }],
    });
  }
  const path = encodePath(routeTokens(route), route.hops.map((h) => h.fee));
  return encodeFunctionData({
    abi: routerAbi,
    functionName: "exactInput",
    args: [{ path, recipient, amountIn, amountOutMinimum: minOut }],
  });
}

/** Arguments for router.multicall(deadline, [swap]). Recipient is always the connected wallet. */
export function buildSwapTx(args: { route: Route; amountIn: bigint; minOut: bigint; recipient: Address; nowSec?: number }) {
  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  const deadline = BigInt(now + DEADLINE_SECONDS);
  return {
    address: SWAP_ROUTER,
    abi: routerAbi,
    functionName: "multicall" as const,
    args: [deadline, [buildSwapCalldata(args)]] as const,
  };
}

// ---------- xStocks auto-enable ----------

/**
 * Accepts an xStock for swapping only when it has code, its on-chain symbol matches the expected
 * xStocks symbol, and a USDC V3 pool with in-range liquidity exists. Otherwise null (stays "Coming soon").
 */
export async function loadXStockToken(client: PublicClient, address: string, expectedSymbol: string): Promise<SwapToken | null> {
  try {
    const addr = getAddress(address);
    const code = await client.getCode({ address: addr });
    if (!code || code === "0x") return null;
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address: addr, abi: erc20Abi, functionName: "symbol" }),
      client.readContract({ address: addr, abi: erc20Abi, functionName: "decimals" }),
    ]);
    if (symbol !== expectedSymbol) return null;
    const usdc = SWAP_TOKENS[0];
    for (const fee of FEE_TIERS) {
      const pool = await client.readContract({ address: V3_FACTORY, abi: factoryAbi, functionName: "getPool", args: [addr, usdc.address, fee] });
      if (pool === ZERO) continue;
      const liq = await client.readContract({ address: pool, abi: poolAbi, functionName: "liquidity" });
      if (liq > 0n) {
        return { symbol, name: `${symbol} (xStocks)`, address: addr, decimals: Number(decimals), color: "#8b9bb3", hub: false };
      }
    }
    return null;
  } catch {
    return null;
  }
}

