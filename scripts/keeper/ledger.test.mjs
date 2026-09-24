import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { getAddress } from "viem";
import { CREATOR_WALLET } from "./cycle.mjs";
import {
  advanceLedger,
  emptyLedger,
  ledgerTotals,
  loadLedger,
  parseAddressList,
  saveLedger,
  topicFor,
  topSenders,
  TRANSFER_TOPIC,
} from "./ledger.mjs";

const U = 1_000_000n;
const USDC = "0x3600000000000000000000000000000000000000";
const KEEPER = "0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F";
const FEES = "0x000000000000000000000000000000000000fEe5";
const EVE_PAYER = "0x00000000000000000000000000000000000000E1";
const ROUTER = "0x000000000000000000000000000000000000Da7A";

function log(block, from, to, amount) {
  return {
    address: USDC,
    blockNumber: `0x${block.toString(16)}`,
    topics: [TRANSFER_TOPIC, topicFor(from), topicFor(to)],
    data: `0x${amount.toString(16).padStart(64, "0")}`,
  };
}

/** A JSON-RPC stand-in that answers eth_getLogs the way a node filters. */
function fakeRpc(logs, { failFrom } = {}) {
  const calls = [];
  const rpc = async (method, [filter]) => {
    assert.equal(method, "eth_getLogs");
    const from = Number(filter.fromBlock);
    const to = Number(filter.toBlock);
    calls.push([from, to]);
    if (failFrom !== undefined && to >= failFrom) throw new Error("pruned history unavailable");
    return logs.filter((l) => {
      const b = Number(l.blockNumber);
      if (b < from || b > to || l.address !== filter.address) return false;
      return filter.topics.every((t, i) => t === null || t === undefined || t === l.topics[i]);
    });
  };
  return { rpc, calls };
}

const LOGS = [
  log(105, FEES, KEEPER, 300n * U),
  log(110, EVE_PAYER, KEEPER, 7n * U),
  log(120, KEEPER, CREATOR_WALLET, 30n * U),
  log(130, KEEPER, ROUTER, 200n * U),
  log(140, FEES, KEEPER, 200n * U),
  log(150, ROUTER, EVE_PAYER, 999n * U), // not the keeper's
];

test("inflows fold per sender and outflows per recipient", async () => {
  const { rpc } = fakeRpc(LOGS);
  const { ledger, error } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 160, rpc });
  assert.equal(error, null);
  assert.equal(ledger.scannedTo, 160);
  assert.equal(ledger.inflowBy[getAddress(FEES)], (500n * U).toString());
  assert.equal(ledger.inflowBy[getAddress(EVE_PAYER)], (7n * U).toString());
  assert.equal(ledger.outflowBy[getAddress(CREATOR_WALLET)], (30n * U).toString());
  assert.equal(ledger.outflowBy[getAddress(ROUTER)], (200n * U).toString());
  assert.equal(Object.keys(ledger.inflowBy).length, 2);
});

test("only fee-source inflows count, and payments to any creator wallet count as paid", async () => {
  const { rpc } = fakeRpc(LOGS);
  const { ledger } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 160, rpc });
  assert.deepEqual(ledgerTotals(ledger, { feeSources: [FEES], creatorWallets: [CREATOR_WALLET] }), {
    feeIncome: 500n * U,
    cutPaid: 30n * U,
  });
  // No fee sources set yet: nothing is income, but the inflows are already recorded for later.
  assert.equal(ledgerTotals(ledger, { feeSources: [], creatorWallets: [CREATOR_WALLET] }).feeIncome, 0n);
  // A wallet the creator used before still counts as paid.
  assert.equal(ledgerTotals(ledger, { feeSources: [FEES], creatorWallets: ["0x0000000000000000000000000000000000000001", CREATOR_WALLET] }).cutPaid, 30n * U);
});

test("each tick scans only new blocks, in chunks", async () => {
  const { rpc, calls } = fakeRpc(LOGS);
  let { ledger } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 125, rpc, chunk: 10 });
  assert.deepEqual(calls, [[100, 109], [100, 109], [110, 119], [110, 119], [120, 125], [120, 125]]);
  calls.length = 0;
  ({ ledger } = await advanceLedger({ ledger, head: 125, rpc, chunk: 10 }));
  assert.deepEqual(calls, []);
  ({ ledger } = await advanceLedger({ ledger, head: 160, rpc, chunk: 100 }));
  assert.deepEqual(calls, [[126, 160], [126, 160]]);
  assert.equal(ledgerTotals(ledger, { feeSources: [FEES], creatorWallets: [CREATOR_WALLET] }).feeIncome, 500n * U);
});

test("a failed chunk keeps the blocks before it and reports the gap", async () => {
  const { rpc } = fakeRpc(LOGS, { failFrom: 130 });
  const { ledger, error } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 160, rpc, chunk: 10 });
  assert.match(error, /logs 130-139: pruned history unavailable/);
  assert.equal(ledger.scannedTo, 129);
  assert.equal(ledger.inflowBy[getAddress(FEES)], (300n * U).toString());
});

test("one tick scans at most maxBlocks", async () => {
  const { rpc } = fakeRpc(LOGS);
  const { ledger, error } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 160, rpc, maxBlocks: 25 });
  assert.equal(error, null);
  assert.equal(ledger.scannedTo, 124);
});

test("the ledger file round-trips and refuses another keeper", async () => {
  const dir = mkdtempSync(join(tmpdir(), "keeper-ledger-"));
  const path = join(dir, "keeper-ledger.json");
  const fresh = loadLedger(path, { keeper: KEEPER, token: USDC, startBlock: 100 });
  assert.equal(fresh.scannedTo, 99);
  const { rpc } = fakeRpc(LOGS);
  const { ledger } = await advanceLedger({ ledger: fresh, head: 160, rpc });
  saveLedger(path, ledger);
  const again = loadLedger(path, { keeper: KEEPER.toLowerCase(), token: USDC, startBlock: 1 });
  assert.equal(again.scannedTo, 160);
  assert.equal(again.startBlock, 100);
  assert.deepEqual(again.inflowBy, ledger.inflowBy);

  writeFileSync(path, JSON.stringify({ ...ledger, keeper: "0x0000000000000000000000000000000000000001" }));
  assert.throws(() => loadLedger(path, { keeper: KEEPER, token: USDC, startBlock: 100 }), /belongs to keeper/);
});

test("top senders list the biggest inflows first", async () => {
  const { rpc } = fakeRpc(LOGS);
  const { ledger } = await advanceLedger({ ledger: emptyLedger({ keeper: KEEPER, token: USDC, startBlock: 100 }), head: 160, rpc });
  assert.deepEqual(
    topSenders(ledger).map((row) => [row.address, row.amount]),
    [
      [getAddress(FEES), 500n * U],
      [getAddress(EVE_PAYER), 7n * U],
    ],
  );
});

test("FEE_SOURCES parses and rejects a bad address", () => {
  assert.deepEqual(parseAddressList(""), []);
  assert.deepEqual(parseAddressList(` ${FEES.toLowerCase()} , ${ROUTER}`), [getAddress(FEES), getAddress(ROUTER)]);
  assert.throws(() => parseAddressList("0x1234"), /bad address/);
});
