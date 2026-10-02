import { usd } from "./format";
import { STOCKS, type Stock } from "./stocks";

/** Stocks shown on the share card. The cash sleeve stays on the book, not on this card. */
export const CARD_ASSET_LIMIT = 8;

export type HeldAsset = {
  ticker: string;
  name: string;
  kind: Stock["kind"];
  amount: number;
  valueUsd: number;
};

export type FolioCard = {
  rewardsUsd: number;
  stonk: number;
  sample: boolean;
  holder: string;
  assets: HeldAsset[];
  hidden: number;
};

const HOLDER_OK = /^[A-Za-z0-9 .]{1,24}$/;

export function holderLabel(address: string | undefined, sample: boolean) {
  if (sample) return "Sample";
  if (!address || !address.startsWith("0x") || address.length < 10) return "Holder";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const SHARE_ORIGIN = "https://www.stonkfolio.me";

export function sharePageUrl(query: string) {
  return `${SHARE_ORIGIN}/share?${query}`;
}

/** A .png address. X skips extensionless preview images that carry a query string. */
export function shareCardImageUrl(query: string) {
  return `${SHARE_ORIGIN}/share/card.png?${query}`;
}

export function heldAssets(earned: Record<string, number>, stocks: readonly Stock[] = STOCKS): HeldAsset[] {
  return priced(earned, stocks)
    .filter((asset) => asset.kind !== "mmf");
}

/** Every credited asset, including the cash sleeve, so rewards match the folio total. */
export function recordedAssets(earned: Record<string, number>, stocks: readonly Stock[] = STOCKS): HeldAsset[] {
  return priced(earned, stocks);
}

export function folioCardSearch(input: { stonk: number; sample: boolean; holder: string; assets: HeldAsset[] }) {
  const params = new URLSearchParams();
  params.set("stonk", String(finiteStonk(input.stonk)));
  if (input.sample) params.set("sample", "1");
  params.set("holder", sanitizeHolder(input.holder));
  const assets = input.assets
    .filter((asset) => asset.amount > 0)
    .slice(0, 16)
    .map((asset) => `${asset.ticker}:${trimAmount(asset.amount)}`)
    .join(",");
  if (assets) params.set("assets", assets);
  return params.toString();
}

export function parseFolioCard(params: URLSearchParams, stocks: readonly Stock[] = STOCKS): FolioCard {
  const earned: Record<string, number> = {};
  for (const part of (params.get("assets") ?? "").split(",")) {
    if (!part) continue;
    const [ticker, raw] = part.split(":");
    const amount = Number(raw);
    if (!ticker || !/^[A-Z0-9]{1,8}$/.test(ticker) || !Number.isFinite(amount) || amount <= 0 || amount > 1e12) continue;
    earned[ticker] = amount;
  }
  const recorded = priced(earned, stocks);
  const visible = recorded.filter((asset) => asset.kind !== "mmf");
  const shown = visible.slice(0, CARD_ASSET_LIMIT);
  return {
    rewardsUsd: recorded.reduce((sum, asset) => sum + asset.valueUsd, 0),
    stonk: finiteStonk(Number(params.get("stonk"))),
    sample: params.get("sample") === "1",
    holder: sanitizeHolder(params.get("holder") ?? ""),
    assets: shown,
    hidden: Math.max(0, visible.length - shown.length),
  };
}

function priced(earned: Record<string, number>, stocks: readonly Stock[]): HeldAsset[] {
  return stocks
    .filter((stock) => (earned[stock.ticker] ?? 0) > 0)
    .map((stock) => {
      const amount = earned[stock.ticker] ?? 0;
      return { ticker: stock.ticker, name: stock.name, kind: stock.kind, amount, valueUsd: amount * stock.price };
    })
    .sort((a, b) => b.valueUsd - a.valueUsd || a.ticker.localeCompare(b.ticker));
}

export function shareText(card: FolioCard) {
  const names = card.assets.map((asset) => asset.ticker);
  if (card.hidden > 0) names.push(`+${card.hidden} more`);
  const held = names.length ? names.join(", ") : "none yet";
  const who = card.sample ? "Sample folio" : "My Stonkfolio";
  return `${who}. Rewards received ${usd(card.rewardsUsd)}. Assets held: ${held}.`;
}

function finiteStonk(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, 1e15);
}

function sanitizeHolder(value: string) {
  const trimmed = value.trim().slice(0, 24);
  return HOLDER_OK.test(trimmed) ? trimmed : "Holder";
}

function trimAmount(amount: number) {
  return String(Math.round(amount * 1e8) / 1e8);
}
