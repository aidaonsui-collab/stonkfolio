import Dinari from "@dinari/api-sdk";
import { STOCKS } from "./stocks";

export type DinariEnv = "sandbox" | "production";

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
