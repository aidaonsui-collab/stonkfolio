#!/usr/bin/env node
/**
 * Stonkfolio keeper tick. Runs on Jessica's Air (com.stonkfolio.keeper).
 * Reads Eve's Circle Agent Wallet USDC/USYC on Arc, advances the USDC ledger,
 * and writes the creator cut and the buy plan.
 * Does not sign or broadcast. KEEPER_EXECUTE is recorded and ignored.
 */
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CREATOR_CUT_BPS, CREATOR_WALLET, PAST_CREATOR_WALLETS, planCreatorCut, planCycle, parseBookTokens, swapCommands } from "./cycle.mjs";
import { advanceLedger, ledgerTotals, loadLedger, parseAddressList, saveLedger, topSenders } from "./ledger.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });
const LEDGER_PATH = join(dataDir, "keeper-ledger.json");

const KEEPER = (process.env.KEEPER_AGENT_WALLET || "0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F").toLowerCase();
const USDC = "0x3600000000000000000000000000000000000000";
const USYC = (process.env.USYC_ADDRESS || "0x8a5D989Bbb96929F689B0200f435f53dA42bF490").toLowerCase();
const RPC = process.env.ARC_RPC || "https://rpc.arc-scan.org";
const LOGS_RPC = process.env.ARC_LOGS_RPC || RPC;
const LIVE = process.env.KEEPER_LIVE === "1";
/** Read this many blocks behind head, so a lagging RPC node already has the logs. About 15 seconds. */
const SAFE_LAG = 30;

const BAL_OF = "0x70a08231" + "000000000000000000000000" + KEEPER.slice(2).padStart(40, "0");

let rpcId = 0;
async function rpc(method, params, url = RPC) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "rpc error");
  return json.result;
}

async function balanceAt(token, block) {
  return BigInt((await rpc("eth_call", [{ to: token, data: BAL_OF }, block])) || "0x0");
}

function fmt(n, dp = 6) {
  const s = n.toString().padStart(dp + 1, "0");
  const i = s.slice(0, -dp);
  const f = s.slice(-dp).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

const msg = (e) => (e instanceof Error ? e.message : String(e));

const now = new Date().toISOString();
let head = null;
let usdc = 0n;
let usyc = 0n;
let err = null;
try {
  head = Number(BigInt(await rpc("eth_blockNumber", [], LOGS_RPC))) - SAFE_LAG;
  // Balances and the ledger are read at the same block, so a payment is never half-counted.
  const at = `0x${head.toString(16)}`;
  usdc = await balanceAt(USDC, at);
  try {
    usyc = await balanceAt(USYC, at);
  } catch {
    usyc = 0n;
  }
} catch (e) {
  err = msg(e);
}

let feeSources = [];
let configError = null;
try {
  feeSources = parseAddressList(process.env.FEE_SOURCES);
} catch (e) {
  configError = `FEE_SOURCES: ${msg(e)}`;
}

let ledger = null;
let ledgerError = null;
if (head !== null) {
  try {
    // LEDGER_START_BLOCK only applies when the ledger file is created.
    const start = process.env.LEDGER_START_BLOCK ? Number(process.env.LEDGER_START_BLOCK) : head;
    const res = await advanceLedger({
      ledger: loadLedger(LEDGER_PATH, { keeper: KEEPER, token: USDC, startBlock: start }),
      head,
      rpc: (method, params) => rpc(method, params, LOGS_RPC),
    });
    ledger = res.ledger;
    ledgerError = res.error;
    saveLedger(LEDGER_PATH, ledger);
  } catch (e) {
    ledgerError = msg(e);
  }
}

const current = ledger !== null && ledgerError === null && ledger.scannedTo >= head;
let cut = null;
if (feeSources.length > 0 && ledger) {
  const { feeIncome, cutPaid } = ledgerTotals(ledger, {
    feeSources,
    creatorWallets: [CREATOR_WALLET, ...PAST_CREATOR_WALLETS],
  });
  cut = { feeIncome, ...planCreatorCut({ feeIncome, cutPaid, balance: usdc, current, agent: KEEPER }) };
}
// A bad FEE_SOURCES, or sources with no ledger, means the cut is unknown. Hold rather than spend it.
const cutUnknown = configError !== null || (feeSources.length > 0 && cut === null);
const bookUsdc = cut ? usdc - cut.reserved : usdc;

const MIN_BUY = 150n * 1_000_000n;
let plan = null;
let planError = null;
if (cutUnknown) {
  plan = { action: "hold", reason: "creator cut unknown; the book waits", legs: [], unspent: usdc };
} else {
  try {
    plan = planCycle({ usdc: bookUsdc, book: parseBookTokens(process.env.BOOK_TOKENS || ""), minBuy: MIN_BUY });
  } catch (e) {
    planError = msg(e);
  }
}
const action = plan?.action || "hold";
const spent = plan ? plan.legs.reduce((n, leg) => n + leg.amountIn, 0n) : 0n;
const status = {
  at: now,
  host: process.env.INDEXER_WORKER || "jessica-air",
  keeper: KEEPER,
  distributor: "0x75ff1625d5A94155dD436BcbEA6C09909F048881",
  live: LIVE,
  block: head,
  action,
  usdc: fmt(usdc),
  cutUsdc: fmt(cut ? cut.reserved : 0n),
  bookUsdc: fmt(bookUsdc),
  buyUsdc: fmt(spent),
  sleeveUsdc: fmt(plan ? plan.unspent : usdc),
  usyc: fmt(usyc),
  spend: false,
  creatorCut: cut
    ? {
        wallet: cut.wallet,
        bps: cut.bps,
        feeIncome: fmt(cut.feeIncome),
        entitled: fmt(cut.entitled),
        paid: fmt(cut.paid),
        owed: fmt(cut.owed),
        reserved: fmt(cut.reserved),
        send: fmt(cut.send),
        reason: cut.reason,
      }
    : {
        wallet: CREATOR_WALLET,
        bps: Number(CREATOR_CUT_BPS),
        reason:
          configError ||
          (feeSources.length > 0
            ? `no ledger: ${ledgerError || err}`
            : "Set FEE_SOURCES to the contract that pays launch fees to the keeper. Inflows are already being recorded."),
      },
  ledger: ledger
    ? {
        startBlock: ledger.startBlock,
        scannedTo: ledger.scannedTo,
        current,
        feeSources,
        topSenders: topSenders(ledger).map((row) => ({ address: row.address, usdc: fmt(row.amount) })),
        error: ledgerError,
      }
    : { error: ledgerError },
  plan: plan
    ? {
        action: plan.action,
        reason: plan.reason,
        unspent: plan.unspent.toString(),
        legs: plan.legs.map((leg) => ({ symbol: leg.symbol, kind: leg.kind, amountIn: leg.amountIn.toString() })),
      }
    : null,
  commands: [...(cut?.call ? [cut.call.command] : []), ...(plan ? swapCommands(plan, KEEPER).map((row) => row.command) : [])],
  error: err || configError || ledgerError || planError,
};
if (LIVE && process.env.KEEPER_EXECUTE === "1") {
  appendFileSync(join(dataDir, "tick.err.log"), `${now} KEEPER_EXECUTE is set, but this tick does not broadcast\n`);
}
writeFileSync(join(dataDir, "keeper-status.json"), JSON.stringify(status, null, 2));
appendFileSync(
  join(dataDir, "tick.out.log"),
  `${now} action=${action} usdc=${status.usdc} cut=${status.cutUsdc} usyc=${status.usyc}${status.error ? ` err=${status.error}` : ""}\n`,
);

if (LIVE && process.env.PATH?.includes("circle") === false) {
  appendFileSync(join(dataDir, "tick.err.log"), `${now} KEEPER_LIVE=1 but circle CLI not confirmed\n`);
}

console.log(JSON.stringify(status));
