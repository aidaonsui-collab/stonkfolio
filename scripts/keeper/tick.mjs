#!/usr/bin/env node
/**
 * Stonkfolio keeper tick. Runs on Jessica's Air (com.stonkfolio.keeper).
 * Reads Eve's Circle Agent Wallet USDC/USYC on Arc. Does not spend unless
 * KEEPER_LIVE=1 and `circle` is on PATH with a logged-in session.
 */
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

const KEEPER = (process.env.KEEPER_AGENT_WALLET || "0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F").toLowerCase();
const USDC = "0x3600000000000000000000000000000000000000";
const USYC = (process.env.USYC_ADDRESS || "0x8a5D989Bbb96929F689B0200f435f53dA42bF490").toLowerCase();
const RPC = process.env.ARC_RPC || "https://rpc.arc-scan.org";
const LIVE = process.env.KEEPER_LIVE === "1";

const BAL_OF = "0x70a08231" + "000000000000000000000000" + KEEPER.slice(2).padStart(40, "0");

async function ethCall(to, data) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "rpc error");
  return BigInt(json.result || "0x0");
}

function fmt(n, dp = 6) {
  const s = n.toString().padStart(dp + 1, "0");
  const i = s.slice(0, -dp);
  const f = s.slice(-dp).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

const now = new Date().toISOString();
let usdc = 0n;
let usyc = 0n;
let err = null;
try {
  usdc = await ethCall(USDC, BAL_OF);
  try {
    usyc = await ethCall(USYC, BAL_OF);
  } catch {
    usyc = 0n;
  }
} catch (e) {
  err = e instanceof Error ? e.message : String(e);
}

const buy = (usdc * 95n) / 100n;
const sleeve = usdc - buy;
const action = usdc > 0n ? "buy" : "hold";
const status = {
  at: now,
  host: process.env.INDEXER_WORKER || "jessica-air",
  keeper: KEEPER,
  distributor: "0x75ff1625d5A94155dD436BcbEA6C09909F048881",
  live: LIVE,
  action,
  usdc: fmt(usdc),
  buyUsdc: fmt(buy),
  sleeveUsdc: fmt(sleeve),
  usyc: fmt(usyc),
  spend: false,
  error: err,
};
if (LIVE && usdc > 0n && !process.env.BOOK_TOKENS) {
  appendFileSync(join(dataDir, "tick.err.log"), `${now} buy planned ${fmt(buy)} USDC but BOOK_TOKENS is unset, not spending\n`);
}
writeFileSync(join(dataDir, "keeper-status.json"), JSON.stringify(status, null, 2));
appendFileSync(join(dataDir, "tick.out.log"), `${now} action=${action} usdc=${status.usdc} usyc=${status.usyc}${err ? ` err=${err}` : ""}\n`);

if (LIVE && process.env.PATH?.includes("circle") === false) {
  appendFileSync(join(dataDir, "tick.err.log"), `${now} KEEPER_LIVE=1 but circle CLI not confirmed\n`);
}

console.log(JSON.stringify(status));
