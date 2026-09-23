export type StockKind = "equity" | "index" | "mmf";
export type ListingStatus = "queued" | "candidate" | "live";

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
  /**
   * Arc mainnet token when known.
   * Equities/index: Dinari dShare on eip155:5042 (null until Dinari publishes Arc CAs).
   * Cash sleeve (BUIDL/USYC): not Dinari — keep BlackRock/Hashnote issuers.
   */
  address: ArcAddress;
};

/**
 * Creator-chosen book. Swap weights here — dashboard, keeper, and yield all read this list.
 *
 * 2026-09-23: Dinari announced dShares live on Arc. Equity/index issuers retarget to Dinari.
 * Arc dShare addresses are not in Dinari docs (blockchain.md still omits Arc), not found via
 * explorer CREATE2 probes (empty morning CT), and sandbox API only returns
 * eip155:179205 / eip155:11155111 — not eip155:5042. Keep address null until production
 * stock list or an official registry publishes Arc CAs. Do not invent addresses.
 */
export const STOCKS: Stock[] = [
  { ticker: "CRCL", name: "Circle Internet Group", issuer: "Dinari", kind: "equity", weight: 16, price: 124.0, status: "live", color: "#5b4dff", letter: "C", address: null },
  { ticker: "NVDA", name: "NVIDIA", issuer: "Dinari", kind: "equity", weight: 12, price: 218.29, status: "live", color: "#76b900", letter: "N", address: null },
  { ticker: "AAPL", name: "Apple", issuer: "Dinari", kind: "equity", weight: 10, price: 332.52, status: "live", color: "#111111", letter: "", address: null },
  { ticker: "MSFT", name: "Microsoft", issuer: "Dinari", kind: "equity", weight: 9, price: 428.1, status: "live", color: "#00a4ef", letter: "M", address: null },
  { ticker: "GOOGL", name: "Alphabet", issuer: "Dinari", kind: "equity", weight: 8, price: 198.4, status: "live", color: "#4285f4", letter: "G", address: null },
  { ticker: "AMZN", name: "Amazon", issuer: "Dinari", kind: "equity", weight: 8, price: 257.13, status: "live", color: "#ff9900", letter: "a", address: null },
  { ticker: "META", name: "Meta Platforms", issuer: "Dinari", kind: "equity", weight: 6, price: 612.2, status: "live", color: "#0668e1", letter: "∞", address: null },
  { ticker: "TSLA", name: "Tesla", issuer: "Dinari", kind: "equity", weight: 6, price: 367.6, status: "live", color: "#cc0000", letter: "T", address: null },
  { ticker: "AMD", name: "AMD", issuer: "Dinari", kind: "equity", weight: 5, price: 515.94, status: "live", color: "#000000", letter: "▶", address: null },
  { ticker: "COIN", name: "Coinbase", issuer: "Dinari", kind: "equity", weight: 4, price: 274.07, status: "live", color: "#0052ff", letter: "C", address: null },
  { ticker: "SPY", name: "S&P 500", issuer: "Dinari", kind: "index", weight: 8, price: 770.25, status: "live", color: "#1b4dff", letter: "S", address: null },
  // Not in Dinari sandbox catalog (live /api/dinari/stocks missing BE). Queue until listed.
  { ticker: "BE", name: "Bloom Energy", issuer: "Dinari", kind: "equity", weight: 3, price: 271.14, status: "queued", color: "#111111", letter: "BE", address: null },
  { ticker: "BUIDL", name: "BlackRock USD Institutional Digital Liquidity Fund", issuer: "BlackRock / Securitize", kind: "mmf", weight: 3, price: 1, status: "live", color: "#000000", letter: "BU", address: null },
  // Cash sleeve — not Dinari. Arc USYC from project .env.example / keeper constant.
  { ticker: "USYC", name: "Hashnote Short Duration Yield", issuer: "Hashnote / Circle", kind: "mmf", weight: 2, price: 1, status: "live", color: "#4e2eff", letter: "US", address: "0x8a5D989Bbb96929F689B0200f435f53dA42bF490" },
];

export const stockByTicker = Object.fromEntries(STOCKS.map((s) => [s.ticker, s])) as Record<string, Stock>;

export const SLEEVE_TONE: Record<StockKind, string> = {
  equity: "var(--color-equity)",
  index: "var(--color-index)",
  mmf: "var(--color-cash)",
};

export const SLEEVES: { id: StockKind; label: string; hint: string }[] = [
  { id: "equity", label: "Equities", hint: "Dinari dShares the keeper buys first on Arc." },
  { id: "index", label: "Index", hint: "Broad book. Overnight cover." },
  { id: "mmf", label: "Cash", hint: "BUIDL / USYC sleeve of the book (not Dinari)." },
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
  { id: "8", received: "Sep 18, 11:02", ticker: "USYC", amount: 18.4, tx: "0xcafebabedeadbeefcafebabedeadbeefcafebabe" },
];

/** Preview holder wallet. */
export const PREVIEW_HOLDER = {
  stonk: 12_480_000,
  sharePct: 1.248,
  /** 70% holder leg, claimable USDC after the eve.fun keeper reflect(). */
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
