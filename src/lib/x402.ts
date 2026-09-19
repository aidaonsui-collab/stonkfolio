import { ARC_CHAIN_ID, ARC_USDC_ERC20 } from "./chain";
import { x402PayTo } from "./keeper";

export const X402_VERSION = 2;
export const ARC_X402_NETWORK = `eip155:${ARC_CHAIN_ID}`;

const NAV_USD = 0.01;
const DIST_USD = 0.05;

export function priceUsd(kind: "nav" | "distributions") {
  const env = kind === "nav" ? process.env.X402_NAV_PRICE : process.env.X402_DISTRIBUTIONS_PRICE;
  const n = env ? Number(env) : kind === "nav" ? NAV_USD : DIST_USD;
  return Number.isFinite(n) && n > 0 ? n : kind === "nav" ? NAV_USD : DIST_USD;
}

/** USDC ERC-20 on Arc is 6 decimals. */
export function atomicUsdc(usd: number) {
  return String(Math.round(usd * 1_000_000));
}

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: { name: string; version: string; assetTransferMethod: string };
};

export function acceptsFor(usd: number): PaymentRequirements[] {
  return [
    {
      scheme: "exact",
      network: ARC_X402_NETWORK,
      amount: atomicUsdc(usd),
      asset: ARC_USDC_ERC20,
      payTo: x402PayTo(),
      maxTimeoutSeconds: 60,
      extra: { name: "USDC", version: "2", assetTransferMethod: "eip3009" },
    },
  ];
}

export function publicOrigin(request: Request) {
  const fromEnv = process.env.STONKFOLIO_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv.replace(/\/$/, "")}`;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return "https://stonkfolio-eight.vercel.app";
}

export function encodeHeader(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function paymentRequired(request: Request, opts: { usd: number; description: string; hint: string }) {
  const url = `${publicOrigin(request)}${new URL(request.url).pathname}${new URL(request.url).search}`;
  const accepts = acceptsFor(opts.usd);
  const required = {
    x402Version: X402_VERSION,
    error: "PAYMENT_REQUIRED",
    resource: { url, description: opts.description, mimeType: "application/json" },
    accepts,
  };
  return {
    status: 402 as const,
    body: {
      error: "PAYMENT_REQUIRED",
      hint: opts.hint,
      merchant: "Stonkfolio",
      priceUsd: opts.usd,
      payTo: accepts[0]?.payTo,
      network: ARC_X402_NETWORK,
    },
    headers: {
      "PAYMENT-REQUIRED": encodeHeader(required),
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, Content-Type",
      "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
    },
  };
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "PAYMENT-SIGNATURE, Content-Type",
    "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
  };
}

export function hasPaymentSignature(request: Request) {
  return Boolean(request.headers.get("PAYMENT-SIGNATURE") || request.headers.get("payment-signature"));
}

/**
 * Paid fulfillment is on when a facilitator can settle.
 * Unpaid always 402. A signature without a facilitator still 402 (do not fake a fill).
 */
export function paymentGateOpen() {
  return Boolean(process.env.CIRCLE_API_KEY?.trim() && process.env.X402_SETTLE === "1");
}
