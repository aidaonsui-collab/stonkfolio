export type StockKind = "equity" | "index" | "mmf";
/**
 * Book listing state. `announced` = the issuer has said it is coming to Arc but has published no Arc
 * contract. Not tradeable. `live` is only for assets that are actually on Arc and tradeable.
 */
export type ListingStatus = "queued" | "candidate" | "live" | "announced";

/** Arc mainnet (5042) ERC-20. Null until a public contract is confirmed — never invent. */
export type ArcAddress = `0x${string}` | null;

export type Stock = {
  ticker: string;
  name: string;
  issuer: string;
  kind: StockKind;
  /** Target weight of creator-USDC buys. Sum of equities + cash sleeve = 100. */
  weight: number;
  price: number;
  status: ListingStatus;
  color: string;
  letter: string;
  /** xStocks symbol (Backed / Payward) for equities and index rows. Null for the cash sleeve. */
  xSymbol: string | null;
  /**
   * Arc mainnet token when known.
   * Equities/index: xStocks have no published Arc contract yet, so this stays null. Never invent one.
   * Cash sleeve: Circle Earn Morpho vault. USDC in, vault shares out.
   * A non-null address is NOT enough to trade — gate on `tradeable`.
   */
  address: ArcAddress;
  /** Wrapped xStock on Arc, if the issuer ever publishes one. Null today. */
  wrappedAddress: ArcAddress;
  /**
   * Keeper / UI may treat as buyable only when true.
   * xStocks stay false until the issuer deploys on Arc, supply exists, and a real venue exists.
   */
  tradeable: boolean;
};

/** Human label for the book status badge. */
export function listingLabel(s: Pick<Stock, "status" | "tradeable" | "address" | "kind">): string {
  if (s.status === "announced") return "Not yet on Arc";
  if (s.status === "queued") return "queued";
  if (s.status === "candidate") return "candidate";
  if (s.kind !== "mmf" && !s.tradeable && s.status === "live") return "Not yet on Arc";
  return s.status;
}

/**
 * Creator-chosen book. Swap weights here — dashboard, keeper, and yield all read this list.
 *
 * Equity and index rows are xStocks (Backed / Payward, xstocks.fi). Checked 2026-10-01: the public
 * xStocks assets API (api.xstocks.fi/api/v2/public/assets) lists every book name below, but none of its
 * ~1,270 products has an Arc deployment yet, and no Arc contract address has been published.
 * So every xStock row has address null, status "announced" and tradeable false. Do not invent addresses.
 * Fill `address` only from an issuer-published Arc deployment, then flip `tradeable` after supply and a
 * real venue exist. Cash sleeve is Circle Earn, not USYC or BUIDL.
 */
export const STOCKS: Stock[] = [
  { ticker: "CRCL", name: "Circle xStock", issuer: "xStocks", kind: "equity", weight: 16, price: 124.0, status: "announced", color: "#5b4dff", letter: "C", xSymbol: "CRCLx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "NVDA", name: "NVIDIA xStock", issuer: "xStocks", kind: "equity", weight: 12, price: 218.29, status: "announced", color: "#76b900", letter: "N", xSymbol: "NVDAx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "AAPL", name: "Apple xStock", issuer: "xStocks", kind: "equity", weight: 10, price: 332.52, status: "announced", color: "#111111", letter: "", xSymbol: "AAPLx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "MSFT", name: "Microsoft xStock", issuer: "xStocks", kind: "equity", weight: 9, price: 428.1, status: "announced", color: "#00a4ef", letter: "M", xSymbol: "MSFTx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "GOOGL", name: "Alphabet xStock", issuer: "xStocks", kind: "equity", weight: 8, price: 198.4, status: "announced", color: "#4285f4", letter: "G", xSymbol: "GOOGLx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "AMZN", name: "Amazon.com xStock", issuer: "xStocks", kind: "equity", weight: 8, price: 257.13, status: "announced", color: "#ff9900", letter: "a", xSymbol: "AMZNx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "META", name: "Meta xStock", issuer: "xStocks", kind: "equity", weight: 6, price: 612.2, status: "announced", color: "#0668e1", letter: "∞", xSymbol: "METAx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "TSLA", name: "Tesla xStock", issuer: "xStocks", kind: "equity", weight: 6, price: 367.6, status: "announced", color: "#cc0000", letter: "T", xSymbol: "TSLAx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "AMD", name: "AMD xStock", issuer: "xStocks", kind: "equity", weight: 5, price: 515.94, status: "announced", color: "#000000", letter: "▶", xSymbol: "AMDx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "COIN", name: "Coinbase xStock", issuer: "xStocks", kind: "equity", weight: 4, price: 274.07, status: "announced", color: "#0052ff", letter: "C", xSymbol: "COINx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "SPY", name: "SP500 xStock", issuer: "xStocks", kind: "index", weight: 8, price: 770.25, status: "announced", color: "#1b4dff", letter: "S", xSymbol: "SPYx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "BE", name: "Bloom Energy xStock", issuer: "xStocks", kind: "equity", weight: 3, price: 271.14, status: "announced", color: "#111111", letter: "BE", xSymbol: "BEx", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "EARN", name: "Circle Earn USDC", issuer: "Morpho / Dialectic", kind: "mmf", weight: 5, price: 1, status: "live", color: "#4e2eff", letter: "E", xSymbol: null, address: "0x6bdfE1165D5165808d02dE05969c9a19e9b7cf30", wrappedAddress: null, tradeable: true },
];

export const stockByTicker = Object.fromEntries(STOCKS.map((s) => [s.ticker, s])) as Record<string, Stock>;

export const SLEEVE_TONE: Record<StockKind, string> = {
  equity: "var(--color-equity)",
  index: "var(--color-index)",
  mmf: "var(--color-cash)",
};

export const SLEEVES: { id: StockKind; label: string; hint: string }[] = [
  { id: "equity", label: "Equities", hint: "xStocks. Announced for Arc, not yet deployed — keeper waits." },
  { id: "index", label: "Index", hint: "Broad book. Overnight cover." },
  { id: "mmf", label: "Cash", hint: "5% of fee USDC. Deposited in Circle Earn on Morpho." },
];

export function sleeveWeight(kind: StockKind) {
  return STOCKS.filter((s) => s.kind === kind).reduce((n, s) => n + s.weight, 0);
}

export type Distribution = {
  id: string;
  received: string;
  ticker: string;
  amount: number;
  tx: string;
};

/** Preview tape only. Not indexed, not on-chain. */
export const PREVIEW_DISTRIBUTIONS: Distribution[] = [
  { id: "1", received: "Sep 16, 14:12", ticker: "CRCL", amount: 0.0842, tx: "0x7a1c9e2b4d6f80a1c3e5b7d9f1023456789abcde" },
  { id: "2", received: "Sep 16, 14:12", ticker: "NVDA", amount: 0.0411, tx: "0x7a1c9e2b4d6f80a1c3e5b7d9f1023456789abcde" },
  { id: "3", received: "Sep 16, 18:40", ticker: "AAPL", amount: 0.0224, tx: "0x91bb00aa11cc22dd33ee44ff5566778899aabbcc" },
  { id: "4", received: "Sep 17, 09:05", ticker: "SPY", amount: 0.0088, tx: "0x55aa1199cc88ee77ff00aabbccddeeff00112233" },
  { id: "5", received: "Sep 17, 09:05", ticker: "MSFT", amount: 0.0156, tx: "0x55aa1199cc88ee77ff00aabbccddeeff00112233" },
  { id: "6", received: "Sep 17, 21:18", ticker: "AMZN", amount: 0.0192, tx: "0x0f0e0d0c0b0a09080706050403020100fedcba98" },
  { id: "7", received: "Sep 18, 11:02", ticker: "TSLA", amount: 0.0114, tx: "0xcafebabedeadbeefcafebabedeadbeefcafebabe" },
  { id: "8", received: "Sep 18, 11:02", ticker: "EARN", amount: 18.4, tx: "0xcafebabedeadbeefcafebabedeadbeefcafebabe" },
];

/** Preview holder wallet. */
export const PREVIEW_HOLDER = {
  stonk: 12_480_000,
  sharePct: 1.248,
  /** Rewards leg, claimable USDC after the keeper claims it. */
  holderUsdc: 42.18,
  /** Units of each stock sitting in the wallet from distributions, not yet farmed. */
  earned: {
    CRCL: 0.0842,
    NVDA: 0.0411,
    AAPL: 0.0224,
    SPY: 0.0088,
    MSFT: 0.0156,
    AMZN: 0.0192,
    TSLA: 0.0114,
    EARN: 18.4,
    GOOGL: 0.0091,
    META: 0.0044,
    AMD: 0.0038,
    COIN: 0.0062,
    BE: 0.0021,

  } as Record<string, number>,
};

export function earnedValue(earned: Record<string, number>) {
  return STOCKS.reduce((sum, s) => sum + (earned[s.ticker] ?? 0) * s.price, 0);
}

export function protocolPreview() {
  return {
    usdcToHolders: 64_470,
    usdcRouted: 18_420,
    stocksBoughtUsd: 17_980,
    holders: 1_842,
    lastCycle: "Sep 18, 11:02",
  };
}

/** Mark value sent to holders, split by book weight. Rows sum to the total. */
export function cumulativeDistributed() {
  const budget = protocolPreview().stocksBoughtUsd;
  const rows = STOCKS.map((stock) => ({
    stock,
    usd: (budget * stock.weight) / 100,
  })).sort((a, b) => b.usd - a.usd || a.stock.ticker.localeCompare(b.stock.ticker));
  const totalUsd = rows.reduce((sum, row) => sum + row.usd, 0);
  return { totalUsd, rows };
}
