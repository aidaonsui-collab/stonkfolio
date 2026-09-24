import { ARC_CHAIN_ID } from "./chain";
import { LAUNCH } from "./fees";
import { EVE_AGENT_WALLET, keeperAddress, keeperPlan, treasuryAddress, usycAddress, x402PayTo } from "./keeper";
import { PREVIEW_DISTRIBUTIONS, PREVIEW_HOLDER, STOCKS, earnedValue, sleeveWeight, type Distribution } from "./stocks";

export function bookPayload() {
  const plan = keeperPlan();
  return {
    venue: "stonkfolio",
    chainId: ARC_CHAIN_ID,
    pair: LAUNCH.pair,
    uniswap: LAUNCH.uniswap,
    feeBps: LAUNCH.feeBps,
    split: LAUNCH.split,
    keeper: {
      kind: "circle-agent-wallet",
      address: keeperAddress(),
      eveWallet: EVE_AGENT_WALLET,
      treasury: treasuryAddress(),
      usyc: usycAddress(),
      plan,
    },
    sleeves: {
      equity: sleeveWeight("equity"),
      index: sleeveWeight("index"),
      mmf: sleeveWeight("mmf"),
    },
    stocks: STOCKS.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      issuer: s.issuer,
      kind: s.kind,
      weight: s.weight,
      price: s.price,
      status: s.status,
      tradeable: s.tradeable,
      address: s.address,
      wrappedAddress: s.wrappedAddress,
    })),
  };
}

export function navPayload(opts?: { wallet?: string; preview?: boolean }) {
  const preview = Boolean(opts?.preview) || !opts?.wallet;
  const earned = preview ? PREVIEW_HOLDER.earned : {};
  const history: Distribution[] = preview ? PREVIEW_DISTRIBUTIONS : [];
  const stocksUsd = earnedValue(earned);
  const plan = keeperPlan();
  return {
    asOf: new Date().toISOString(),
    chainId: ARC_CHAIN_ID,
    preview,
    wallet: opts?.wallet ?? null,
    markUsd: stocksUsd,
    stonk: preview ? PREVIEW_HOLDER.stonk : 0,
    sharePct: preview ? PREVIEW_HOLDER.sharePct : 0,
    earned,
    history,
    keeper: {
      address: keeperAddress(),
      payTo: x402PayTo(),
      plan: plan.action,
    },
  };
}
