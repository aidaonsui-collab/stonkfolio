import { NextResponse } from "next/server";
import { FOLIO_DISTRIBUTOR, x402PayTo } from "@/lib/keeper";
import { corsHeaders, priceUsd, publicOrigin, ARC_X402_NETWORK } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/** Catalog for Circle Agent Marketplace. Listing itself is a Circle review form. */
export function GET(request: Request) {
  const origin = publicOrigin(request);
  return NextResponse.json(
    {
      name: "Stonkfolio",
      description: "The stock book that buys itself. Fees buy tokenized stocks for $SFOLIO holders.",
      network: ARC_X402_NETWORK,
      payTo: x402PayTo(),
      distributor: FOLIO_DISTRIBUTOR,
      openapi: `${origin}/api/openapi`,
      resources: [
        { method: "GET", url: `${origin}/api/book`, priceUsd: 0 },
        { method: "GET", url: `${origin}/api/nav`, priceUsd: priceUsd("nav") },
        { method: "GET", url: `${origin}/api/distributions`, priceUsd: priceUsd("distributions") },
      ],
      list: "https://forms.gle/7YFzvdmMcn1JH5tF6",
    },
    { headers: corsHeaders() },
  );
}
