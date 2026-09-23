import Dinari from "@dinari/api-sdk";
import { STOCKS } from "./stocks";

export type DinariEnv = "sandbox" | "production";

/** Arc mainnet CAIP-2. Docs still omit Arc; prefer tokens on this chain when present. */
export const ARC_CAIP2 = "eip155:5042";

export function dinariConfigured() {
  return Boolean(process.env.DINARI_API_KEY_ID && process.env.DINARI_API_SECRET_KEY);
}

export function dinariEnv(): DinariEnv {
  return process.env.DINARI_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function getDinari() {
  if (!dinariConfigured()) return null;
  return new Dinari({
    apiKeyID: process.env.DINARI_API_KEY_ID,
    apiSecretKey: process.env.DINARI_API_SECRET_KEY,
    environment: dinariEnv(),
  });
}

export const BASKET_SYMBOLS = STOCKS.filter((s) => s.kind !== "mmf").map((s) => s.ticker);

/** Parse Dinari `tokens[]` CAIP refs like `eip155:5042:0x…` or `eip155:5042/erc20:0x…`. */
export function parseDinariTokenRef(ref: string): { caip2: string; address: `0x${string}` } | null {
  const m = ref.match(/^(eip155:\d+)(?:\/(?:erc20|slip44):\d*:?)?:?(0x[a-fA-F0-9]{40})$/i);
  if (!m) return null;
  return { caip2: m[1], address: m[2] as `0x${string}` };
}

export function pickArcToken(tokens: string[] | undefined | null): `0x${string}` | null {
  if (!tokens?.length) return null;
  const want = ARC_CAIP2.toLowerCase();
  for (const t of tokens) {
    const parsed = parseDinariTokenRef(t);
    if (parsed && parsed.caip2.toLowerCase() === want) return parsed.address;
  }
  return null;
}

export function tokenChains(tokens: string[] | undefined | null): string[] {
  if (!tokens?.length) return [];
  const out = new Set<string>();
  for (const t of tokens) {
    const parsed = parseDinariTokenRef(t);
    if (parsed) out.add(parsed.caip2);
  }
  return [...out];
}
