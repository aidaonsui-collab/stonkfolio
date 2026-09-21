import { NextResponse } from "next/server";
import { settlePayment } from "./facilitator";
import { acceptsFor, hasPaymentSignature, paymentRequired, publicOrigin, corsHeaders } from "./x402";

/** 402 until Circle Facilitator reports success. Pending is not fulfillment. */
export async function paidOrReject(request: Request, usd: number, description: string) {
  if (!hasPaymentSignature(request)) {
    const gate = paymentRequired(request, {
      usd,
      description,
      hint: "Retry with PAYMENT-SIGNATURE. Arc USDC via Circle Facilitator.",
    });
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }
  const header = request.headers.get("PAYMENT-SIGNATURE") || request.headers.get("payment-signature") || "";
  const url = `${publicOrigin(request)}${new URL(request.url).pathname}${new URL(request.url).search}`;
  const settled = await settlePayment(header, acceptsFor(usd)[0]!, url, description);
  if (!settled.ok) {
    const gate = paymentRequired(request, { usd, description, hint: settled.reason });
    return NextResponse.json(gate.body, { status: gate.status, headers: { ...gate.headers, ...corsHeaders() } });
  }
  return null;
}
