import { NextResponse } from "next/server";
import { navPayload } from "@/lib/book";
import { paidOrReject } from "@/lib/paid";
import { corsHeaders, priceUsd } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const denied = await paidOrReject(request, priceUsd("distributions"), "Stonkfolio stock distributions for a wallet.");
  if (denied) return denied;
  const url = new URL(request.url);
  const nav = navPayload({ wallet: url.searchParams.get("wallet") ?? undefined, preview: url.searchParams.get("preview") === "1" });
  return NextResponse.json(
    { wallet: nav.wallet, preview: nav.preview, earned: nav.earned, history: nav.history, markUsd: nav.markUsd },
    { headers: corsHeaders() },
  );
}
