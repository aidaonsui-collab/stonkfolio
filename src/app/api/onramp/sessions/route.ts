import { createOnrampServerKit, createSessionRouteHandler } from "@circle-fin/onramp-kit/server";
import { isAddress } from "viem";
import { ONRAMP_WIDGET_BASE_URL } from "@/lib/onramp";

const ONRAMP_API_BASE_URL = process.env.ONRAMP_API_BASE_URL?.trim() || "https://api-test.circle.com";
const ONRAMP_REFERRER_DOMAIN = process.env.ONRAMP_REFERRER_DOMAIN?.trim() || "www.stonkfolio.me";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ message: "Send a wallet address." }, { status: 400, headers: noStore });
  }

  const body = raw && typeof raw === "object" ? (raw as { appUserId?: unknown; destinationAddress?: unknown }) : {};
  const destinationAddress = typeof body.destinationAddress === "string" ? body.destinationAddress.trim() : "";
  const appUserId = typeof body.appUserId === "string" ? body.appUserId.trim() : "";
  if (!isAddress(destinationAddress)) {
    return Response.json({ message: "Connect a wallet on Arc." }, { status: 400, headers: noStore });
  }

  const apiKey = process.env.ONRAMP_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ message: "Add USDC is not available yet." }, { status: 503, headers: noStore });
  }

  const server = createOnrampServerKit({
    apiKey,
    baseUrl: ONRAMP_API_BASE_URL,
    widgetBaseUrl: ONRAMP_WIDGET_BASE_URL,
    referrerDomain: ONRAMP_REFERRER_DOMAIN,
  });

  const forced = new Request(request.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appUserId: appUserId || destinationAddress.toLowerCase(),
      destinationAddress,
      destinationChain: "arc",
      currency: "USDC",
      assets: { pairs: [{ token: "USDC", chain: "arc" }] },
    }),
  });

  return createSessionRouteHandler(server)(forced);
}
