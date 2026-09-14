/** eve.fun Uniswap v4 Instant fee card for $STONK. Platform floor is 10%. */

export const LAUNCH = {
  venue: "eve.fun",
  type: "Creator",
  pair: "STONK / USDC",
  uniswap: "v4",
  /** Pool fee in bps of notional. 100 = 1.0%. */
  feeBps: 100,
  split: {
    creatorBps: 7_000,
    burnBps: 1_000,
    holdersBps: 0,
    autoLpBps: 1_000,
    platformBps: 1_000,
  },
} as const;

export const FEE_LEGS = [
  { key: "creator", label: "Creator", bps: LAUNCH.split.creatorBps, hint: "Rewards wallet. This is the keeper that buys dShares." },
  { key: "burn", label: "Burn", bps: LAUNCH.split.burnBps, hint: "Launch token to dead" },
  { key: "autoLp", label: "Auto-LP", bps: LAUNCH.split.autoLpBps, hint: "Stays in the STONK/USDC pool" },
  { key: "platform", label: "eve.fun", bps: LAUNCH.split.platformBps, hint: "Pad floor" },
] as const;

export function pctOfFee(bps: number) {
  return `${bps / 100}%`;
}

export function feeOnVolume(notionalUsd: number, legBps: number) {
  return notionalUsd * (LAUNCH.feeBps / 10_000) * (legBps / 10_000);
}
