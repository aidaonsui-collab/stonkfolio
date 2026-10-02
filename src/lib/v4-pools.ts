/**
 * Candidate Uniswap v4 pools on Arc: no hooks (hooks = 0x0), fee at most 1%, and liquidity of at least
 * 100,000 (raw units) on 2026-10-01. Found by scanning the PoolManager Initialize events from its
 * deployment block (1,948,056) to block 23,790,666 (scripts/swap/v4-scan.mts) and reading
 * StateView.getLiquidity for each. Liquidity is re-read live on every quote; this list only says which
 * (fee, tickSpacing) pairs are worth asking about, since v4 has no factory to enumerate.
 *
 * Hooked pools are left out on purpose: a hook can change swap behavior and has not been reviewed.
 * Pools with a fee above 1% are left out too (Arc has many pools at 9%-99% fees; they are not routable value).
 * Entry: [symbol A, symbol B, fee in pips, tickSpacing]. Pools created later are still found when they use
 * the standard tiers in V4_POOL_SPECS; for others, re-run the scan and add them here.
 */
export const KNOWN_V4_POOLS: readonly (readonly [string, string, number, number])[] = [
  ["USDC", "EURC", 500, 10],
  ["cirBTC", "USDC", 9000, 90],
  ["cirBTC", "EURC", 9000, 90],
  ["cirBTC", "USDC", 2500, 25],
  ["USDC", "EURC", 2500, 25],
  ["USDC", "EURC", 75, 1],
  ["cirBTC", "USDC", 75, 1],
  ["cirBTC", "USDC", 3000, 30],
  ["cirBTC", "EURC", 5000, 50],
  ["WETH", "USDC", 75, 1],
  ["WETH", "USDC", 2500, 25],
  ["WETH", "cirBTC", 10000, 100],
  ["WETH", "USDC", 1500, 15],
  ["cirBTC", "USDC", 1500, 15],
  ["USDC", "EURC", 180, 2],
  ["WETH", "USDC", 375, 4],
  ["WETH", "cirBTC", 2500, 25],
  ["WETH", "EURC", 9000, 90],
];
