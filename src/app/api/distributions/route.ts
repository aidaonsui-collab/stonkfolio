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
      usd: priceUsd("distributions"),
      description: "Stonkfolio stock distributions for a holder wallet.",
      hint: "Retry with PAYMENT-SIGNATURE. $0.05 USDC on Arc. PayTo is Eve's Arc Facilitator wallet.",
    });
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet") ?? undefined;
  const preview = url.searchParams.get("preview") === "1";
  const nav = navPayload({ wallet, preview });
  return NextResponse.json(
    {
      wallet: nav.wallet,
      preview: nav.preview,
      earned: nav.earned,
      history: nav.history,
      markUsd: nav.markUsd,
    },
    { headers: corsHeaders() },
  );
}
