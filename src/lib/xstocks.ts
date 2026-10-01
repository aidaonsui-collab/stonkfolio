import { STOCKS } from "./stocks";

/** xStocks (Backed / Payward) public catalog. No API key. https://xstocks.fi */
export const XSTOCKS_API = "https://api.xstocks.fi/api/v2/public/assets";
export const XSTOCKS_SITE = "https://xstocks.fi";

/** Network name the xStocks API would use for Arc. Matched loosely, since none exists yet. */
const ARC_NETWORK = /^arc/i;

export const BOOK_X_SYMBOLS = STOCKS.flatMap((s) => (s.xSymbol ? [s.xSymbol] : []));

type XDeployment = { network: string; address: string };
type XAsset = { symbol: string; name: string; deployments?: XDeployment[] };
type XPage = { nodes: XAsset[]; page: { currentPage: number; hasNextPage: boolean } };

/** Reads the public xStocks catalog and reports which book names have an Arc deployment. */
export async function readXStocksCatalog() {
  const want = new Set(BOOK_X_SYMBOLS);
  const found = new Map<string, { name: string; networks: string[]; arcAddress: string | null }>();
  let total = 0;
  for (let page = 0; page < 30; page++) {
    const res = await fetch(`${XSTOCKS_API}?limit=100&page=${page}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`xStocks API ${res.status}`);
    const body = (await res.json()) as XPage;
    total += body.nodes.length;
    for (const a of body.nodes) {
      if (!want.has(a.symbol)) continue;
      const deployments = a.deployments ?? [];
      const arc = deployments.find((d) => ARC_NETWORK.test(d.network));
      found.set(a.symbol, {
        name: a.name,
        networks: deployments.map((d) => d.network),
        arcAddress: arc?.address ?? null,
      });
    }
    if (!body.page?.hasNextPage) break;
  }
  return { total, found };
}
