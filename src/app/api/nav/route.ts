import { NextResponse } from "next/server";
import { navPayload } from "@/lib/book";
import { paidOrReject } from "@/lib/paid";
import { corsHeaders, priceUsd } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const denied = await paidOrReject(request, priceUsd("nav"), "Stonkfolio book value for a wallet.");
  if (denied) return denied;
  const url = new URL(request.url);
  return NextResponse.json(navPayload({ wallet: url.searchParams.get("wallet") ?? undefined, preview: url.searchParams.get("preview") === "1" }), {
    headers: corsHeaders(),
  });
}
