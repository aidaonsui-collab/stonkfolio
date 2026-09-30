#!/usr/bin/env node
/**
 * Register StonkFolio's Borrow Kit integrator fee with Circle, once per Circle account.
 * Borrows made through /v1/borrowKit on the site then carry this fee to the fee wallet.
 *
 *   node --env-file=.env.local scripts/borrow/set-integrator-fee.mjs --check   # read only
 *   node --env-file=.env.local scripts/borrow/set-integrator-fee.mjs           # set it
 *
 * Needs CIRCLE_API_KEY (<ENV>_API_KEY:<keyId>:<keySecret>). The rate and wallet are read from
 * src/lib/borrow.ts so the site's disclosure and the registered fee cannot drift apart.
 */
import { readFileSync } from "node:fs";
import { BorrowKit, BorrowServiceProvider } from "@circle-fin/borrow-kit";

const src = readFileSync(new URL("../../src/lib/borrow.ts", import.meta.url), "utf8");
const bps = Number(src.match(/BORROW_FEE_BPS = (\d+);/)?.[1]);
const wallet = src.match(/BORROW_FEE_WALLET = getAddress\("(0x[0-9a-fA-F]{40})"\)/)?.[1];
if (!Number.isInteger(bps) || !wallet) throw new Error("could not read BORROW_FEE_BPS / BORROW_FEE_WALLET from src/lib/borrow.ts");

const apiKey = process.env.CIRCLE_API_KEY?.trim();
if (!apiKey) {
  console.error("STOP: CIRCLE_API_KEY is not set. Add it to .env.local (and Vercel) first.");
  process.exit(1);
}

const kit = new BorrowKit({ providers: [new BorrowServiceProvider({ apiKey })] });
const show = (label, c) => console.log(`${label}: ${c ? `${c.integratorFeeBps} bps → ${c.integratorFeeAddress ?? "no wallet"}` : "none"}`);

let current = null;
try {
  current = await kit.getIntegratorConfig({ config: { apiKey } });
} catch (err) {
  // A fresh account has no config yet; that is the state to set, not a failure.
  if (!/CONFIG_NOT_FOUND|\b1206\b/.test(`${err?.name} ${err?.code} ${err?.message}`)) throw err;
}
show("current", current);
console.log(`target:  ${bps} bps → ${wallet}`);

if (process.argv.includes("--check")) process.exit(0);
if (current && current.integratorFeeBps === bps && current.integratorFeeAddress?.toLowerCase() === wallet.toLowerCase()) {
  console.log("already set; nothing to do");
  process.exit(0);
}
const next = await kit.setIntegratorConfig({ integratorFeeBps: bps, integratorFeeAddress: wallet, config: { apiKey } });
show("saved", next);
