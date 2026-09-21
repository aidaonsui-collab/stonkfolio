import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/x402";
import { corsHeaders } from "@/lib/x402";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const origin = publicOrigin(request);
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Stonkfolio",
      version: "0.1.0",
      description:
        "Arc stock folio. Free GET /api/book is the keeper book and fee card. GET /api/nav and GET /api/distributions are x402 paid (Arc USDC, Circle Facilitator). PayTo is Eve's existing Arc wallet.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/book": {
        get: {
          summary: "Keeper book (free)",
          description: "Weights, listing status, and the keeper wallet. No payment.",
          responses: { "200": { description: "Book JSON" } },
        },
      },
      "/api/nav": {
        get: {
          summary: "NAV at mark",
          description: "Paid. Unpaid calls return HTTP 402 with PAYMENT-REQUIRED.",
          parameters: [
            { name: "wallet", in: "query", schema: { type: "string" } },
            { name: "preview", in: "query", schema: { type: "string" } },
          ],
          "x-payment": { protocols: [{ x402: {} }] },
          responses: {
            "200": { description: "NAV JSON after settle" },
            "402": { description: "Payment required. Read PAYMENT-REQUIRED." },
          },
        },
      },
      "/api/distributions": {
        get: {
          summary: "Holder stock distributions",
          description: "Paid. Unpaid calls return HTTP 402 with PAYMENT-REQUIRED.",
          "x-payment": { protocols: [{ x402: {} }] },
          responses: {
            "200": { description: "Distribution JSON after settle" },
            "402": { description: "Payment required." },
          },
        },
      },
      "/api/earn/vaults": {
        get: {
          summary: "Circle Earn Kit Morpho vaults on Arc",
          responses: { "200": { description: "Vault list" } },
        },
      },
    },
  };
  return NextResponse.json(spec, { headers: corsHeaders() });
}
