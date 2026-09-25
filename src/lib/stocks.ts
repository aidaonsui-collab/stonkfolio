export type StockKind = "equity" | "index" | "mmf";
/** Book listing state. `deployed-unminted` = Arc CA known, totalSupply 0, not tradeable. */
export type ListingStatus = "queued" | "candidate" | "live" | "deployed-unminted";

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
   * Equities/index: Dinari plain dShare on eip155:5042.
   * Cash sleeve: Circle Earn Morpho vault. USDC in, vault shares out. Not Dinari.
   * A non-null address is NOT enough to trade — gate on `tradeable`.
   */
  address: ArcAddress;
  /** Dinari wrapped dShare (`.dw`) on Arc. Null for cash / unverified. */
  wrappedAddress: ArcAddress;
  /**
   * Keeper / UI may treat as buyable only when true.
   * Dinari Arc dShares stay false until totalSupply > 0 and a real venue exists.
   */
  tradeable: boolean;
};

/** Human label for the book status badge. */
export function listingLabel(s: Pick<Stock, "status" | "tradeable" | "address" | "kind">): string {
  if (s.status === "deployed-unminted") return "On Arc, not yet minted";
  if (s.status === "queued") return "queued";
  if (s.status === "candidate") return "candidate";
  if (s.kind !== "mmf" && s.address && !s.tradeable) return "On Arc, not yet minted";
  return s.status;
}

/**
 * Creator-chosen book. Swap weights here — dashboard, keeper, and yield all read this list.
 *
 * 2026-09-24: Arc Dinari diamond 0xf60f689ec22fC2D485b3C734eFE58538cCc28766 registers dShares.
 * Plain + wrapped (.dw) CAs filled for verified book names. totalSupply is 0 on all of them;
 * no Uniswap v3 USDC pools. tradeable stays false until mint. AMD/COIN not found via diamond
 * CREATE enumeration (proxies not diamond-created; getDShares not on Arc facet) — left null.
 * BE stays queued (not in Dinari catalog). Cash sleeve is Circle Earn, not USYC or BUIDL.
 */
export const STOCKS: Stock[] = [
  { ticker: "CRCL", name: "Circle Internet Group", issuer: "Dinari", kind: "equity", weight: 16, price: 124.0, status: "deployed-unminted", color: "#5b4dff", letter: "C", address: "0x2eBbD389bf504fA9f0600361ef70C15eb62Cc93B", wrappedAddress: "0x31323f4DB9a6EAB5cC149Ae43155B4756B5FFD7a", tradeable: false },
  { ticker: "NVDA", name: "NVIDIA", issuer: "Dinari", kind: "equity", weight: 12, price: 218.29, status: "deployed-unminted", color: "#76b900", letter: "N", address: "0x4B16f5251cd4c853f28998809DcA61ccCBcB898B", wrappedAddress: "0x7BFdE9230dbDAD218671ED6556c767D6E214EB1C", tradeable: false },
  { ticker: "AAPL", name: "Apple", issuer: "Dinari", kind: "equity", weight: 10, price: 332.52, status: "deployed-unminted", color: "#111111", letter: "", address: "0xB6b0149009eb78239213b97A960b5c793C03373b", wrappedAddress: "0x4C3556888fe97755B35f8b3EBE2a4C52b638a2fF", tradeable: false },
  { ticker: "MSFT", name: "Microsoft", issuer: "Dinari", kind: "equity", weight: 9, price: 428.1, status: "deployed-unminted", color: "#00a4ef", letter: "M", address: "0x1831FdAC7Fcb9271f2E2FfB1bbba965CcAf8136B", wrappedAddress: "0x82d10e0e8C66de7b23B2F2230B279CDB0523B9Ba", tradeable: false },
  { ticker: "GOOGL", name: "Alphabet", issuer: "Dinari", kind: "equity", weight: 8, price: 198.4, status: "deployed-unminted", color: "#4285f4", letter: "G", address: "0x7024f993A0781169E064346396c5F6139DC6d98A", wrappedAddress: "0x3D589A3c5dE0209d3Ca15A6e03266F7cC83f3F3E", tradeable: false },
  { ticker: "AMZN", name: "Amazon", issuer: "Dinari", kind: "equity", weight: 8, price: 257.13, status: "deployed-unminted", color: "#ff9900", letter: "a", address: "0xAbA4a08C36404f6EFf79Dc85b0b4c5172A095504", wrappedAddress: "0xD6F02c18F5D0Ff2F688CFE80A199131ACE44b2Ce", tradeable: false },
  { ticker: "META", name: "Meta Platforms", issuer: "Dinari", kind: "equity", weight: 6, price: 612.2, status: "deployed-unminted", color: "#0668e1", letter: "∞", address: "0x5183EfaBdDA4F872788307B705163982036ba962", wrappedAddress: "0xF7F6ACE1358b3FabD73959dc9cCbDfc36f974379", tradeable: false },
  { ticker: "TSLA", name: "Tesla", issuer: "Dinari", kind: "equity", weight: 6, price: 367.6, status: "deployed-unminted", color: "#cc0000", letter: "T", address: "0x4193C2B9B176763f48B1eF5266aEd71f6348ba81", wrappedAddress: "0xff987C251de5E898058980915efB3eBC79C6605f", tradeable: false },
  { ticker: "AMD", name: "AMD", issuer: "Dinari", kind: "equity", weight: 5, price: 515.94, status: "deployed-unminted", color: "#000000", letter: "▶", address: "0x2B7c9A6448576790aa6CE639E4c70BBb32E65c43", wrappedAddress: "0x693C563cCdb5A5C2432D6bb282a019c40F68E31F", tradeable: false },
  { ticker: "COIN", name: "Coinbase", issuer: "Dinari", kind: "equity", weight: 4, price: 274.07, status: "deployed-unminted", color: "#0052ff", letter: "C", address: "0x7eE2c4BE439b9571FabC520dE92ad05582492A3D", wrappedAddress: "0x240fbB7E9bb65b2e11005DD5785f814587A1FF09", tradeable: false },
  { ticker: "SPY", name: "S&P 500", issuer: "Dinari", kind: "index", weight: 8, price: 770.25, status: "deployed-unminted", color: "#1b4dff", letter: "S", address: "0x82E9e5725dA9050e121D12802fCC302752aBaA1A", wrappedAddress: "0xbf823fC3e6a9326e4ACb0756388d9FF2566Ca1cA", tradeable: false },
  // Not in Dinari sandbox catalog (live /api/dinari/stocks missing BE). Queue until listed.
  { ticker: "BE", name: "Bloom Energy", issuer: "Dinari", kind: "equity", weight: 3, price: 271.14, status: "queued", color: "#111111", letter: "BE", address: null, wrappedAddress: null, tradeable: false },
  { ticker: "EARN", name: "Circle Earn USDC", issuer: "Morpho / Dialectic", kind: "mmf", weight: 5, price: 1, status: "live", color: "#4e2eff", letter: "E", address: "0x6bdfE1165D5165808d02dE05969c9a19e9b7cf30", wrappedAddress: null, tradeable: true },
];

export const stockByTicker = Object.fromEntries(STOCKS.map((s) => [s.ticker, s])) as Record<string, Stock>;

export const SLEEVE_TONE: Record<StockKind, string> = {
  equity: "var(--color-equity)",
  index: "var(--color-index)",
  mmf: "var(--color-cash)",
};

export const SLEEVES: { id: StockKind; label: string; hint: string }[] = [
  { id: "equity", label: "Equities", hint: "Dinari dShares on Arc. Deployed, not yet minted — keeper waits." },
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
  /** 80% rewards leg, claimable USDC after the keeper reflect(). */
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
