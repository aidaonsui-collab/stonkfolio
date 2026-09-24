import { NextResponse } from "next/server";
import {
  ARC_CAIP2,
  BASKET_SYMBOLS,
  dinariConfigured,
  dinariEnv,
  getDinari,
  pickArcToken,
  tokenChains,
} from "@/lib/dinari";
import { stockByTicker } from "@/lib/stocks";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = dinariEnv();
  if (!dinariConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      environment,
      arcCaip2: ARC_CAIP2,
      reason: "Issuer catalog not configured.",
    });
  }

  const client = getDinari();
  if (!client) {
    return NextResponse.json({ ok: false, configured: false, environment, arcCaip2: ARC_CAIP2 });
  }

  try {
    const listed = await client.v2.marketData.stocks.list({
      symbols: BASKET_SYMBOLS,
      limit: 50,
    });
    const stocks = listed.data.map((s) => {
      const symbol = s.symbol;
      const tokens = s.tokens ?? [];
      const arcAddress = pickArcToken(tokens);
      const book = stockByTicker[symbol.toUpperCase()];
      return {
        id: s.id,
        symbol,
        name: s.display_name ?? s.name,
        tradable: s.is_tradable,
        tokens,
        chains: tokenChains(tokens),
        arcAddress,
        /** Book static plain dShare. Prefer live API arcAddress when set. Not tradeable alone. */
        bookAddress: book?.address ?? null,
        bookWrappedAddress: book?.wrappedAddress ?? null,
        bookIssuer: book?.issuer ?? null,
        bookStatus: book?.status ?? null,
        bookTradeable: book?.tradeable ?? false,
      };
    });
    const have = new Set(stocks.map((n) => n.symbol.toUpperCase()));
    const missing = BASKET_SYMBOLS.filter((t) => !have.has(t));
    const arcCount = stocks.filter((s) => s.arcAddress).length;
    const chainSet = new Set(stocks.flatMap((s) => s.chains));

    return NextResponse.json({
      ok: true,
      configured: true,
      environment,
      testData: environment === "sandbox",
      arcCaip2: ARC_CAIP2,
      arcAddressCount: arcCount,
      chainsSeen: [...chainSet],
      count: stocks.length,
      stocks,
      missing,
      note:
        arcCount === 0
          ? "No eip155:5042 tokens in this Dinari API env yet. Book CAs are filled from the Arc diamond; tradeable stays false until mint."
          : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dinari request failed";
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        environment,
        testData: environment === "sandbox",
        arcCaip2: ARC_CAIP2,
        reason: message,
      },
      { status: 502 },
    );
  }
}
