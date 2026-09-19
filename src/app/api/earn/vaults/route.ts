import { NextResponse } from "next/server";
import { exploreEarnVaults } from "@/lib/earn";
import { corsHeaders } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const result = await exploreEarnVaults();
  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: { ...corsHeaders(), "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
