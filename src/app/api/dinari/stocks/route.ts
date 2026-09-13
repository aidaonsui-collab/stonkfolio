import { NextResponse } from "next/server";
import { BASKET_SYMBOLS, dinariConfigured, dinariEnv, getDinari } from "@/lib/dinari";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = dinariEnv();
  if (!dinariConfigured()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      environment,
      reason: "Missing DINARI_API_KEY_ID / DINARI_API_SECRET_KEY. Put them in .env.local.",
    });
  }

  const client = getDinari();
  if (!client) {
    return NextResponse.json({ ok: false, configured: false, environment });
  }

  try {
    const listed = await client.v2.marketData.stocks.list({
      symbols: BASKET_SYMBOLS,
      limit: 50,
    });
    const names = listed.data.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      name: s.display_name ?? s.name,
      tradable: s.is_tradable,
      tokens: s.tokens,
    }));
    const have = new Set(names.map((n) => n.symbol.toUpperCase()));
    const missing = BASKET_SYMBOLS.filter((t) => !have.has(t));

    return NextResponse.json({
      ok: true,
      configured: true,
      environment,
      testData: environment === "sandbox",
      count: names.length,
      stocks: names,
      missing,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dinari request failed";
    return NextResponse.json(
      { ok: false, configured: true, environment, testData: environment === "sandbox", reason: message },
      { status: 502 },
    );
  }
}
