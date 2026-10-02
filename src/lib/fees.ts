/**
 * Argus fee card for $SFOLIO. A 4% tax on buys and on sells, plus Argus's 1%
 * pool fee. Of what is collected, 90% is rewards and 10% stays with Argus.
 */

export const LAUNCH = {
  venue: "argus",
  type: "Tax",
  pair: "SFOLIO / USDC",
  uniswap: "v4",
  /** Launch tax on each side, bps of notional. 400 = 4%. */
  taxBps: 400,
  /** Argus pool fee, bps of notional. 100 = 1%. Separate from the launch tax. */
  poolFeeBps: 100,
  /** Base schedule per side: tax plus pool fee. The opening surcharge is extra. */
  feeBps: 500,
  split: {
    creatorBps: 9_000,
    burnBps: 0,
    holdersBps: 0,
    autoLpBps: 0,
    platformBps: 1_000,
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
  { key: "platform", label: "Argus", bps: LAUNCH.split.platformBps, hint: "Argus keeps this share of the tax and of the pool fee." },
].filter((leg) => leg.bps > 0);

export function pctOfFee(bps: number) {
  return `${bps / 100}%`;
}

export function feeOnVolume(notionalUsd: number, legBps: number) {
  return notionalUsd * (LAUNCH.feeBps / 10_000) * (legBps / 10_000);
}
