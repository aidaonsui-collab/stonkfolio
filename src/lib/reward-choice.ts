import { getAddress, isAddress, type Address } from "viem";
import { STOCKS } from "./stocks";

/** No signature. The holder stays on the shared book. */
export const BOOK_CHOICE = "BOOK";

export type RewardChoice = {
  address: Address;
  choice: string;
  signature: string;
  signedAt: string;
  message: string;
};

/** Names a holder may sign. Cash sleeve stays inside the book. */
export function choiceStocks() {
  return STOCKS.filter((s) => s.kind !== "mmf");
}

export function normalizeChoice(choice: string) {
  return choice.trim().toUpperCase();
}

export function isChoice(choice: string) {
  const c = normalizeChoice(choice);
  if (c === BOOK_CHOICE) return true;
  return choiceStocks().some((s) => s.ticker === c);
}

export function choiceMessage(wallet: string, choice: string, signedAt: string) {
  return [
    "Stonkfolio next cycle",
    `Wallet: ${getAddress(wallet)}`,
    `Choice: ${normalizeChoice(choice)}`,
    `Signed at: ${signedAt}`,
  ].join("\n");
}

export function parseChoiceBody(body: unknown): { address: Address; choice: string; signature: string; signedAt: string } | null {
  if (!body || typeof body !== "object") return null;
  const row = body as Record<string, unknown>;
  const address = typeof row.address === "string" ? row.address : "";
  const choice = typeof row.choice === "string" ? normalizeChoice(row.choice) : "";
  const signature = typeof row.signature === "string" ? row.signature.trim() : "";
  const signedAt = typeof row.signedAt === "string" ? row.signedAt.trim() : "";
  if (!isAddress(address) || !isChoice(choice) || !/^0x[0-9a-fA-F]+$/.test(signature)) return null;
  const at = Date.parse(signedAt);
  if (!Number.isFinite(at)) return null;
  if (at > Date.now() + 10 * 60 * 1000) return null;
  return { address: getAddress(address), choice, signature, signedAt };
}
