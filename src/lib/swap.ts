import {
  createPublicClient,
  defineChain,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
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
 * Swap on Arc (5042) through Uniswap v3 and v4. Stonkfolio takes no fee and never holds funds:
 * the user's wallet signs approve + swap straight to Uniswap's router (SwapRouter02 for v3, the
 * Universal Router + Permit2 for v4) with itself as recipient.
 * This file only depends on viem so the pure helpers can be tested from node.
 */

export const ARC_CHAIN = 5042;
export const SWAP_RPC = "https://rpc.mainnet.arc.io";

/** Verified on Arc with eth_getCode and the expected selectors, 2026-10-01. */
export const V3_FACTORY = getAddress("0xf0db7b58379503491d857dB50AC9ece64c653918");
export const SWAP_ROUTER = getAddress("0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77");
export const QUOTER_V2 = getAddress("0x7DfD4F31be6814D2906BDE155c3e1B146EAc1468");
export const MULTICALL3 = getAddress("0xcA11bde05977b3631167028862bE2a173976CA11");

/**
 * Uniswap v4 on Arc. All verified on-chain 2026-10-01 with eth_getCode, and by checking that
 * Quoter / StateView / Universal Router / PositionManager each return PoolManager from poolManager().
 * Addresses match developers.uniswap.org/docs/protocols/v4/deployments (Arc: 5042).
 */
export const V4_POOL_MANAGER = getAddress("0x8366a39CC670B4001A1121B8F6A443A643e40951");
export const V4_QUOTER = getAddress("0x8Dc178eFB8111BB0973Dd9d722ebeFF267c98F94");
export const V4_STATE_VIEW = getAddress("0xF3334192D15450CdD385c8B70e03f9A6bD9E673b");
export const UNIVERSAL_ROUTER = getAddress("0x4fcA4a51Ab4F23A7447b3284fBd7D73289A89Fb1");
export const PERMIT2 = getAddress("0x000000000022D473030F116dDEE9F6B43aC78BA3");
/** Permit2 allowance given to the Universal Router lasts this long. */
export const PERMIT2_EXPIRY_SECONDS = 30 * 60;
/** v4 pools are keyed by (fee, tickSpacing). hooks is always zero: hooked pools are not routed. */
export const V4_POOL_SPECS: readonly { fee: number; tickSpacing: number }[] = [
  { fee: 100, tickSpacing: 1 },
  { fee: 500, tickSpacing: 10 },
  { fee: 3000, tickSpacing: 60 },
  { fee: 10000, tickSpacing: 200 },
];

export type Venue = "v3" | "v4";
export const VENUE_LABEL: Record<Venue, string> = { v3: "Uniswap v3", v4: "Uniswap v4" };

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

export const permit2Abi = parseAbi([
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
]);

export const stateViewAbi = parseAbi(["function getLiquidity(bytes32 poolId) view returns (uint128)"]);

const poolKeyComponents = [
  { name: "currency0", type: "address" },
  { name: "currency1", type: "address" },
  { name: "fee", type: "uint24" },
  { name: "tickSpacing", type: "int24" },
  { name: "hooks", type: "address" },
] as const;

/** V4Quoter. Like QuoterV2 it is nonpayable but meant to be eth_called. */
export const v4QuoterAbi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "poolKey", type: "tuple", components: poolKeyComponents },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

export const universalRouterAbi = [
  {
    type: "function",
    name: "execute",
    stateMutability: "payable",
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

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

export type RouteHop = { tokenIn: Address; tokenOut: Address; fee: number; /** v4 only */ tickSpacing?: number };
/** venue defaults to v3 when absent. v4 routes are always a single hop. */
export type Route = { hops: RouteHop[]; venue?: Venue };

export function routeVenue(route: Route): Venue {
  return route.venue ?? "v3";
}

export function routeTokens(route: Route): Address[] {
  return [route.hops[0].tokenIn, ...route.hops.map((h) => h.tokenOut)];
}

export function routeLabel(route: Route, tokens: readonly SwapToken[]): string {
  const sym = (a: string) => tokens.find((t) => t.address.toLowerCase() === a.toLowerCase())?.symbol ?? "?";
  const path = routeTokens(route).map(sym).join(" → ");
  const fees = route.hops.map((h) => `${h.fee / 10_000}%`).join(" + ");
  return `${path} (${fees} fee${route.hops.length > 1 ? "s" : ""})`;
}

// ---------- v4 helpers ----------

/** v4 orders a pool's two currencies by address. */
export function sortCurrencies(a: Address, b: Address): [Address, Address] {
  return BigInt(a) < BigInt(b) ? [a, b] : [b, a];
}

export type V4PoolKey = { currency0: Address; currency1: Address; fee: number; tickSpacing: number; hooks: Address };

export function v4PoolKey(a: Address, b: Address, fee: number, tickSpacing: number): V4PoolKey {
  const [currency0, currency1] = sortCurrencies(a, b);
  return { currency0, currency1, fee, tickSpacing, hooks: ZERO };
}

/** PoolId = keccak256(abi.encode(poolKey)). */
export function v4PoolId(key: V4PoolKey): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
      [key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks],
    ),
  );
}

function hopKey(h: RouteHop): V4PoolKey {
  if (h.tickSpacing === undefined) throw new Error("v4 hop needs tickSpacing");
  return v4PoolKey(h.tokenIn, h.tokenOut, h.fee, h.tickSpacing);
}

const MAX_UINT128 = (1n << 128n) - 1n;
const MAX_UINT160 = (1n << 160n) - 1n;

/** Which approval a v4 swap still needs: ERC-20 to Permit2 first, then Permit2 to the Universal Router. */
export function v4ApprovalStep(args: {
  erc20ToPermit2: bigint;
  permit2Amount: bigint;
  permit2Expiration: number;
  amountIn: bigint;
  nowSec?: number;
}): "erc20" | "permit2" | null {
  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  if (args.erc20ToPermit2 < args.amountIn) return "erc20";
  // Re-approve when the Permit2 allowance is too small or about to lapse (under 5 minutes left).
  if (args.permit2Amount < args.amountIn || args.permit2Expiration <= now + 300) return "permit2";
  return null;
}

/** Permit2.approve(token, UniversalRouter, exact amountIn, short expiry). */
export function buildPermit2ApproveTx(args: { token: Address; amountIn: bigint; nowSec?: number }) {
  if (args.amountIn <= 0n || args.amountIn > MAX_UINT160) throw new Error("bad amount");
  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  return {
    address: PERMIT2,
    abi: permit2Abi,
    functionName: "approve" as const,
    args: [args.token, UNIVERSAL_ROUTER, args.amountIn, now + PERMIT2_EXPIRY_SECONDS] as const,
  };
}

// Universal Router command and v4 router actions (v4-periphery Actions.sol).
const CMD_V4_SWAP = "0x10" as const;
const ACT_SWAP_EXACT_IN_SINGLE = 0x06;
const ACT_SETTLE_ALL = 0x0c;
const ACT_TAKE_ALL = 0x0f;

/**
 * Universal Router execute(0x10 V4_SWAP, [abi.encode(actions, params)], deadline) with
 * SWAP_EXACT_IN_SINGLE, SETTLE_ALL (pays up to amountIn through Permit2), TAKE_ALL (min output, paid to msg.sender).
 */
export function buildV4SwapTx(args: { route: Route; amountIn: bigint; minOut: bigint; nowSec?: number }) {
  const { route, amountIn, minOut } = args;
  if (routeVenue(route) !== "v4" || route.hops.length !== 1) throw new Error("not a single-hop v4 route");
  if (amountIn <= 0n || amountIn > MAX_UINT128 || minOut <= 0n || minOut > MAX_UINT128) throw new Error("bad amounts");
  const hop = route.hops[0];
  const key = hopKey(hop);
  const zeroForOne = hop.tokenIn.toLowerCase() === key.currency0.toLowerCase();
  const currencyOut = zeroForOne ? key.currency1 : key.currency0;
  const actions = ("0x" +
    [ACT_SWAP_EXACT_IN_SINGLE, ACT_SETTLE_ALL, ACT_TAKE_ALL].map((a) => a.toString(16).padStart(2, "0")).join("")) as Hex;
  const swapParams = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "poolKey", type: "tuple", components: poolKeyComponents },
          { name: "zeroForOne", type: "bool" },
          { name: "amountIn", type: "uint128" },
          { name: "amountOutMinimum", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    [{ poolKey: key, zeroForOne, amountIn, amountOutMinimum: minOut, hookData: "0x" }],
  );
  const settle = encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [hop.tokenIn, amountIn]);
  const take = encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [currencyOut, minOut]);
  const input = encodeAbiParameters([{ type: "bytes" }, { type: "bytes[]" }], [actions, [swapParams, settle, take]]);
  const now = args.nowSec ?? Math.floor(Date.now() / 1000);
  return {
    address: UNIVERSAL_ROUTER,
    abi: universalRouterAbi,
    functionName: "execute" as const,
    args: [CMD_V4_SWAP as Hex, [input], BigInt(now + DEADLINE_SECONDS)] as const,
  };
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

/** venue defaults to v3. For v4, `pool` holds the PoolId and tickSpacing is set. */
export type Pool = { a: Address; b: Address; fee: number; pool: Address; liquidity: bigint; venue?: Venue; tickSpacing?: number };

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

const poolCacheV4 = new Map<string, Promise<Pool[]>>();

/**
 * Finds v4 pools (hooks = none) with in-range liquidity between the tokens, by asking StateView for
 * each (fee, tickSpacing) PoolId. v4 has no factory, so this probes the standard fee/spacing pairs.
 * Never throws: if StateView is unreachable or no pool has liquidity, v4 is simply skipped.
 */
export function discoverPoolsV4(client: PublicClient, tokens: readonly SwapToken[]): Promise<Pool[]> {
  const key = tokens.map((t) => t.address.toLowerCase()).sort().join(",");
  const hit = poolCacheV4.get(key);
  if (hit) return hit;
  const run = (async () => {
    const combos = pairsFor(tokens).flatMap(([a, b]) =>
      V4_POOL_SPECS.map((spec) => ({ a: a.address, b: b.address, ...spec, id: v4PoolId(v4PoolKey(a.address, b.address, spec.fee, spec.tickSpacing)) })),
    );
    const liq = await withRetry(() =>
      client.multicall({
        multicallAddress: MULTICALL3,
        allowFailure: true,
        contracts: combos.map((c) => ({ address: V4_STATE_VIEW, abi: stateViewAbi, functionName: "getLiquidity" as const, args: [c.id] as const })),
      }),
    );
    return combos
      .map((c, i) => ({
        a: c.a,
        b: c.b,
        fee: c.fee,
        tickSpacing: c.tickSpacing,
        pool: c.id as Address,
        venue: "v4" as const,
        liquidity: liq[i].status === "success" ? (liq[i].result as bigint) : 0n,
      }))
      .filter((p) => p.liquidity > 0n);
  })().catch(() => {
    // Do not cache a failure (for example an RPC 429): the next quote tries again.
    poolCacheV4.delete(key);
    return [] as Pool[];
  });
  poolCacheV4.set(key, run);
  return run;
}

export function clearPoolCache() {
  poolCache.clear();
  poolCacheV4.clear();
}

/**
 * Direct routes (v3 and v4) and v3 2-hop routes through a hub token, over pools that have liquidity.
 * v4 is direct-only for now, and a route never mixes venues.
 */
export function findRoutes(pools: readonly Pool[], tokens: readonly SwapToken[], tokenIn: Address, tokenOut: Address, max = 40): Route[] {
  const eq = (x: string, y: string) => x.toLowerCase() === y.toLowerCase();
  const edge = (list: readonly Pool[], from: Address, to: Address) =>
    list.filter((p) => (eq(p.a, from) && eq(p.b, to)) || (eq(p.a, to) && eq(p.b, from)));
  const v3Pools = pools.filter((p) => (p.venue ?? "v3") === "v3");
  const v4Pools = pools.filter((p) => p.venue === "v4");
  const routes: Route[] = [];
  for (const p of edge(v3Pools, tokenIn, tokenOut)) {
    routes.push({ venue: "v3", hops: [{ tokenIn, tokenOut, fee: p.fee }] });
  }
  for (const p of edge(v4Pools, tokenIn, tokenOut)) {
    routes.push({ venue: "v4", hops: [{ tokenIn, tokenOut, fee: p.fee, tickSpacing: p.tickSpacing }] });
  }
  for (const mid of tokens.filter((t) => t.hub)) {
    if (eq(mid.address, tokenIn) || eq(mid.address, tokenOut)) continue;
    const first = edge(v3Pools, tokenIn, mid.address);
    const second = edge(v3Pools, mid.address, tokenOut);
    for (const f of first) {
      for (const s of second) {
        routes.push({
          venue: "v3",
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
  if (routeVenue(route) === "v4") {
    const h = route.hops[0];
    const poolKey = hopKey(h);
    return {
      address: V4_QUOTER,
      abi: v4QuoterAbi,
      functionName: "quoteExactInputSingle" as const,
      args: [{ poolKey, zeroForOne: h.tokenIn.toLowerCase() === poolKey.currency0.toLowerCase(), exactAmount: amountIn, hookData: "0x" as Hex }] as const,
    };
  }
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
export async function quoteRoutes(client: PublicClient, routesIn: readonly Route[], amountIn: bigint): Promise<RouteQuote[]> {
  // The v4 quoter takes a uint128 amount; a v4 route cannot take more than that.
  const routes = routesIn.filter((r) => routeVenue(r) !== "v4" || amountIn <= MAX_UINT128);
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
  /** Venue of the chosen route. */
  venue: Venue;
  /** Best quote per venue (null when that venue has no usable route), for comparison. */
  bestV3: RouteQuote | null;
  bestV4: RouteQuote | null;
};

function bestOf(list: readonly RouteQuote[]): RouteQuote | null {
  return list.length ? list.reduce((a, b) => (b.amountOut > a.amountOut ? b : a)) : null;
}

/** Finds the route with the highest output and measures price impact against a small trade. */
export async function quoteBest(
  client: PublicClient,
  tokens: readonly SwapToken[],
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<BestQuote | null> {
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase() || amountIn <= 0n) return null;
  // v4 is best-effort: if its discovery or quote fails, the v3 answer still stands.
  const [pools, poolsV4] = await Promise.all([discoverPools(client, tokens), discoverPoolsV4(client, tokens)]);
  const routes = findRoutes([...pools, ...poolsV4], tokens, tokenIn, tokenOut);
  const quotes = await quoteRoutes(client, routes.filter((r) => routeVenue(r) === "v3"), amountIn);
  const quotesV4 = await quoteRoutes(client, routes.filter((r) => routeVenue(r) === "v4"), amountIn).catch(() => [] as RouteQuote[]);
  const all = [...quotes, ...quotesV4];
  if (!all.length) return null;
  // Highest output wins; a tie stays on v3 because it comes first.
  const best = all.reduce((a, b) => (b.amountOut > a.amountOut ? b : a));
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
  return { amountIn, best, considered: all.length, impactPct, venue: routeVenue(best.route), bestV3: bestOf(quotes), bestV4: bestOf(quotesV4) };
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

