import { NextResponse } from "next/server";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { STOCKS } from "@/lib/stocks";
import { readXStocksCatalog, XSTOCKS_SITE } from "@/lib/xstocks";

export const dynamic = "force-dynamic";

/** Book xStocks and whether the public xStocks catalog lists an Arc deployment for each. */
export async function GET() {
  const book = STOCKS.filter((s) => s.xSymbol);
  try {
    const { total, found } = await readXStocksCatalog();
    const stocks = book.map((s) => {
      const hit = found.get(s.xSymbol as string);
      return {
        ticker: s.ticker,
        xSymbol: s.xSymbol,
        name: hit?.name ?? s.name,
        inCatalog: Boolean(hit),
        catalogNetworks: hit?.networks ?? [],
        catalogArcAddress: hit?.arcAddress ?? null,
        bookAddress: s.address,
        bookStatus: s.status,
        bookTradeable: s.tradeable,
      };
    });
    const arcCount = stocks.filter((s) => s.catalogArcAddress).length;
    return NextResponse.json({
      ok: true,
      source: XSTOCKS_SITE,
      arcChainId: ARC_CHAIN_ID,
      catalogProducts: total,
      arcAddressCount: arcCount,
      stocks,
      note:
        arcCount === 0
          ? "No xStocks product lists an Arc deployment yet. Book rows stay address null and tradeable false."
          : "The catalog lists an Arc address for some names. Verify with the issuer before adding it to stocks.ts.",
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "xStocks request failed";
    return NextResponse.json({ ok: false, source: XSTOCKS_SITE, arcChainId: ARC_CHAIN_ID, reason }, { status: 502 });
  }
}
