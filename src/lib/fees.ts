/** eve.fun Uniswap v4 Instant fee card for $STONK. Platform floor is 10%. */

export const LAUNCH = {
  venue: "eve.fun",
  type: "Reflect",
  pair: "STONK / USDC",
  uniswap: "v4",
  /** Pool fee in bps of notional. 100 = 1.0%. */
  feeBps: 100,
  split: {
    holdersBps: 7_000,
    creatorBps: 2_000,
    platformBps: 1_000,
    burnBps: 0,
    autoLpBps: 0,
  },
} as const;

export const FEE_LEGS = [
  { key: "holders", label: "Holders", bps: LAUNCH.split.holdersBps, hint: "USDC claim, pro rata $STONK" },
  { key: "creator", label: "Keeper", bps: LAUNCH.split.creatorBps, hint: "Buys the Dinari book" },
  { key: "platform", label: "eve.fun", bps: LAUNCH.split.platformBps, hint: "Pad floor" },
] as const;

export function pctOfFee(bps: number) {
  return `${bps / 100}%`;
}

export function feeOnVolume(notionalUsd: number, legBps: number) {
  return notionalUsd * (LAUNCH.feeBps / 10_000) * (legBps / 10_000);
}
