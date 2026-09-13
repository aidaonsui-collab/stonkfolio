export type StockKind = "equity" | "index" | "mmf";
export type ListingStatus = "queued" | "candidate" | "live";

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
};

/**
 * Creator-chosen book. Names wait on public Arc RWA listings after Sept 16.
 * Swap weights here — the dashboard, keeper copy, and yield markets all read this list.
 */
export const STOCKS: Stock[] = [
  { ticker: "CRCL", name: "Circle Internet Group", issuer: "xStocks / Ondo", kind: "equity", weight: 16, price: 124.0, status: "queued", color: "#5b4dff", letter: "C" },
  { ticker: "NVDA", name: "NVIDIA", issuer: "xStocks / Ondo", kind: "equity", weight: 12, price: 218.29, status: "queued", color: "#76b900", letter: "N" },
  { ticker: "AAPL", name: "Apple", issuer: "xStocks", kind: "equity", weight: 10, price: 332.52, status: "queued", color: "#111111", letter: "" },
  { ticker: "MSFT", name: "Microsoft", issuer: "xStocks", kind: "equity", weight: 9, price: 428.1, status: "queued", color: "#00a4ef", letter: "M" },
  { ticker: "GOOGL", name: "Alphabet", issuer: "xStocks", kind: "equity", weight: 8, price: 198.4, status: "queued", color: "#4285f4", letter: "G" },
  { ticker: "AMZN", name: "Amazon", issuer: "xStocks", kind: "equity", weight: 8, price: 257.13, status: "queued", color: "#ff9900", letter: "a" },
  { ticker: "META", name: "Meta Platforms", issuer: "xStocks", kind: "equity", weight: 6, price: 612.2, status: "queued", color: "#0668e1", letter: "∞" },
  { ticker: "TSLA", name: "Tesla", issuer: "xStocks", kind: "equity", weight: 6, price: 367.6, status: "queued", color: "#cc0000", letter: "T" },
  { ticker: "AMD", name: "AMD", issuer: "xStocks", kind: "equity", weight: 5, price: 515.94, status: "queued", color: "#000000", letter: "▶" },
  { ticker: "COIN", name: "Coinbase", issuer: "xStocks", kind: "equity", weight: 4, price: 274.07, status: "queued", color: "#0052ff", letter: "C" },
  { ticker: "SPY", name: "S&P 500", issuer: "xStocks / Ondo", kind: "index", weight: 8, price: 770.25, status: "queued", color: "#1b4dff", letter: "S" },
  { ticker: "BE", name: "Bloom Energy", issuer: "xStocks", kind: "equity", weight: 3, price: 271.14, status: "candidate", color: "#111111", letter: "BE" },
  { ticker: "BUIDL", name: "BlackRock USD Institutional Digital Liquidity Fund", issuer: "BlackRock / Securitize", kind: "mmf", weight: 3, price: 1, status: "queued", color: "#000000", letter: "BU" },
  { ticker: "USYC", name: "Hashnote Short Duration Yield", issuer: "Hashnote / Circle", kind: "mmf", weight: 2, price: 1, status: "queued", color: "#4e2eff", letter: "US" },
];

export const stockByTicker = Object.fromEntries(STOCKS.map((s) => [s.ticker, s])) as Record<string, Stock>;

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
  { id: "8", received: "Sep 18, 11:02", ticker: "USYC", amount: 18.4, tx: "0xcafebabedeadbeefcafebabedeadbeefcafebabe" },
];

/** Preview holder wallet. */
export const PREVIEW_HOLDER = {
  stonk: 12_480_000,
  sharePct: 1.248,
  /** Units of each stock sitting in the wallet from distributions, not yet farmed. */
  earned: {
    CRCL: 0.0842,
    NVDA: 0.0411,
    AAPL: 0.0224,
    SPY: 0.0088,
    MSFT: 0.0156,
    AMZN: 0.0192,
    TSLA: 0.0114,
    USYC: 18.4,
    GOOGL: 0.0091,
    META: 0.0044,
    AMD: 0.0038,
    COIN: 0.0062,
    BE: 0.0021,
    BUIDL: 12.2,
  } as Record<string, number>,
};

export function earnedValue(earned: Record<string, number>) {
  return STOCKS.reduce((sum, s) => sum + (earned[s.ticker] ?? 0) * s.price, 0);
}

export function protocolPreview() {
  return {
    usdcRouted: 18_420,
    stocksBoughtUsd: 17_980,
    holders: 1_842,
    lastCycle: "Sep 18, 11:02",
  };
}
