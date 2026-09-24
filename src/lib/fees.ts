/** Uniswap v4 Instant fee card for $SFOLIO. 80% rewards, 20% platform. */

export const LAUNCH = {
  venue: "pad",
  type: "Creator",
  pair: "SFOLIO / USDC",
  uniswap: "v4",
  /** Pool fee in bps of notional. 100 = 1.0%. */
  feeBps: 100,
  split: {
    creatorBps: 8_000,
    burnBps: 0,
    holdersBps: 0,
    autoLpBps: 0,
    platformBps: 2_000,
  },
} as const;

/** Share of the keeper's fee USDC sent to the creator wallet. The rest buys the book. Same as scripts/keeper/cycle.mjs. */
export const CREATOR_CUT_BPS = 1_000;

export const FEE_LEGS = [
  {
    key: "creator",
    label: "Rewards",
    bps: LAUNCH.split.creatorBps,
    hint: `Keeper wallet. ${pctOfFee(CREATOR_CUT_BPS)} of it goes to the creator. The rest buys the book.`,
  },
  { key: "burn", label: "Burn", bps: LAUNCH.split.burnBps, hint: "Launch token to dead" },
  { key: "autoLp", label: "Auto-LP", bps: LAUNCH.split.autoLpBps, hint: "Stays in the SFOLIO/USDC pool" },
  { key: "platform", label: "Platform", bps: LAUNCH.split.platformBps, hint: "Platform share." },
].filter((leg) => leg.bps > 0);

export function pctOfFee(bps: number) {
  return `${bps / 100}%`;
}

export function feeOnVolume(notionalUsd: number, legBps: number) {
  return notionalUsd * (LAUNCH.feeBps / 10_000) * (legBps / 10_000);
}
