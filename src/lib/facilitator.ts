import { keccak256, toBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_CHAIN_ID } from "./chain";
import { x402PayTo } from "./keeper";
import { ARC_X402_NETWORK, type PaymentRequirements, X402_VERSION } from "./x402";

const FACILITATOR = (process.env.CIRCLE_FACILITATOR_URL || "https://api.circle.com/v1/facilitator").replace(/\/$/, "");

export function settleConfigured() {
  if (process.env.X402_SETTLE === "0") return false;
  const hasSecret = Boolean(process.env.X402_SELLER_PRIVATE_KEY?.trim() || process.env.CIRCLE_API_KEY?.trim());
  if (process.env.X402_SETTLE === "1") return hasSecret;
  return hasSecret;
}

function decodePayload(header: string): Record<string, unknown> {
  const raw = header.trim();
  const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(text) as Record<string, unknown>;
  return parsed;
}

async function sellerProof(purpose: "verify" | "settle" | "status", method: string, body: string) {
  const key = process.env.X402_SELLER_PRIVATE_KEY?.trim();
  if (!key) return null;
  const account = privateKeyToAccount(key as Hex);
  const nonce = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}` as Hex;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 300;
  const payTo = x402PayTo();
  const signature = await account.signTypedData({
    domain: { name: "Circle Facilitator Seller Request", version: "1", chainId: ARC_CHAIN_ID },
    types: {
      SellerRequest: [
        { name: "purpose", type: "string" },
        { name: "method", type: "string" },
        { name: "bodyHash", type: "bytes32" },
        { name: "network", type: "string" },
        { name: "payTo", type: "address" },
        { name: "nonce", type: "bytes32" },
        { name: "issuedAt", type: "uint64" },
        { name: "expiresAt", type: "uint64" },
      ],
    },
    primaryType: "SellerRequest",
    message: {
      purpose,
      method: method.toUpperCase(),
      bodyHash: keccak256(toBytes(body)),
      network: ARC_X402_NETWORK,
      payTo,
      nonce,
      issuedAt: BigInt(issuedAt),
      expiresAt: BigInt(expiresAt),
    },
  });
  const envelope = { version: 1, signature, network: ARC_X402_NETWORK, payTo, nonce, issuedAt, expiresAt };
  return Buffer.from(JSON.stringify(envelope)).toString("base64url");
}

export type SettleResult =
  | { ok: true; payer?: string; transaction?: string }
  | { ok: false; reason: string };

/** Verify and settle a PAYMENT-SIGNATURE against Circle Facilitator. Does not fulfill on pending. */
export async function settlePayment(header: string, requirements: PaymentRequirements, resourceUrl: string, description: string): Promise<SettleResult> {
  if (!settleConfigured()) return { ok: false, reason: "Facilitator settle is not signed yet." };
  let payload: Record<string, unknown>;
  try {
    payload = decodePayload(header);
  } catch {
    return { ok: false, reason: "PAYMENT-SIGNATURE was not readable." };
  }
  const body = JSON.stringify({
    x402Version: X402_VERSION,
    paymentPayload: {
      x402Version: X402_VERSION,
      payload: (payload.payload as object) ?? payload,
      accepted: (payload.accepted as object) ?? requirements,
      resource: (payload.resource as object) ?? { url: resourceUrl, description, mimeType: "application/json" },
    },
    paymentRequirements: requirements,
  });
  const proof = await sellerProof("settle", "POST", body);
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  const apiKey = process.env.CIRCLE_API_KEY?.trim();
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  if (proof) headers["Facilitator-Seller-Proof"] = proof;
  const res = await fetch(`${FACILITATOR}/x402/settle`, { method: "POST", headers, body });
  const text = await res.text();
  if (!res.ok) return { ok: false, reason: `Facilitator ${res.status}` };
  const json = JSON.parse(text) as { success?: boolean; errorReason?: string; payer?: string; transaction?: string };
  if (json.success !== true) return { ok: false, reason: json.errorReason || "settlement_pending" };
  return { ok: true, payer: json.payer, transaction: json.transaction };
}
