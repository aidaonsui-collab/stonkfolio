import { NextResponse } from "next/server";
import { navPayload } from "@/lib/book";
import { corsHeaders, hasPaymentSignature, paymentGateOpen, paymentRequired, priceUsd } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function GET(request: Request) {
  if (!hasPaymentSignature(request) || !paymentGateOpen()) {
    const gate = paymentRequired(request, {
      usd: priceUsd("nav"),
      description: "Stonkfolio NAV and holder marks at last keeper cycle.",
      hint: "Retry with PAYMENT-SIGNATURE. Arc USDC via Circle Facilitator. PayTo is Eve's Arc wallet.",
    });
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet") ?? undefined;
  const preview = url.searchParams.get("preview") === "1";
  return NextResponse.json(navPayload({ wallet, preview }), { headers: corsHeaders() });
}
