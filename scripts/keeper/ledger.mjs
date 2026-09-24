/**
 * Running USDC ledger for the keeper wallet, built from Transfer logs.
 *
 * The public Arc RPC prunes logs older than about a day, so totals since
 * launch cannot be re-read every tick. Each tick scans only the blocks since
 * the last one and folds them into data/keeper-ledger.json. That file is the
 * record, not a cache: if it is lost, older blocks cannot be re-read from the
 * public RPC (set ARC_LOGS_RPC to an archive node to rebuild).
 *
 * Inflows are kept per sender and outflows per recipient. Fee sources and the
 * creator wallet are applied when totals are read, so either can be set or
 * changed later without a rescan.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { getAddress } from "viem";

export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
/** Blocks per eth_getLogs call. About 3 hours of Arc blocks. */
export const LEDGER_CHUNK = 20_000;
/** Most blocks one tick will scan. The rest is picked up next tick. */
export const LEDGER_MAX_BLOCKS = 400_000;

const hex = (n) => `0x${n.toString(16)}`;

export function topicFor(address) {
  return `0x${getAddress(address).slice(2).toLowerCase().padStart(64, "0")}`;
}

function fromTopic(topic) {
  return getAddress(`0x${topic.slice(-40)}`);
}

function add(map, address, amount) {
  map[address] = (BigInt(map[address] || "0") + amount).toString();
}

/** Comma-separated addresses. Blank is an empty list. */
export function parseAddressList(raw) {
  const text = (raw || "").trim();
  if (!text) return [];
  return text.split(",").map((part) => {
    const a = part.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(a)) throw new Error(`bad address: ${a}`);
    return getAddress(a);
  });
}

export function emptyLedger({ keeper, token, startBlock }) {
  if (!Number.isInteger(startBlock) || startBlock < 0) throw new Error("bad ledger start block");
  return {
    version: 1,
    keeper: getAddress(keeper),
    token: getAddress(token),
    startBlock,
    scannedTo: startBlock - 1,
    inflowBy: {},
    outflowBy: {},
  };
}

export function loadLedger(path, { keeper, token, startBlock }) {
  if (!existsSync(path)) return emptyLedger({ keeper, token, startBlock });
  const ledger = JSON.parse(readFileSync(path, "utf8"));
  if (getAddress(ledger.keeper) !== getAddress(keeper) || getAddress(ledger.token) !== getAddress(token)) {
    throw new Error(`${path} belongs to keeper ${ledger.keeper}; move it aside to start a new one`);
  }
  return ledger;
}

/** Write to a temp file, then rename, so a crash never leaves half a ledger. */
export function saveLedger(path, ledger) {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify({ ...ledger, updatedAt: new Date().toISOString() }, null, 2));
  renameSync(tmp, path);
}

/**
 * Scan (scannedTo, head] and fold USDC transfers in and out of the keeper.
 * `rpc(method, params)` returns the JSON-RPC result or throws. A failed chunk
 * stops the scan; blocks before it are kept and the error is returned.
 */
export async function advanceLedger({ ledger, head, rpc, chunk = LEDGER_CHUNK, maxBlocks = LEDGER_MAX_BLOCKS }) {
  const next = { ...ledger, inflowBy: { ...ledger.inflowBy }, outflowBy: { ...ledger.outflowBy } };
  const keeper = topicFor(ledger.keeper);
  const stop = Math.min(head, ledger.scannedTo + maxBlocks);
  let from = ledger.scannedTo + 1;
  while (from <= stop) {
    const to = Math.min(from + chunk - 1, stop);
    const range = { address: ledger.token, fromBlock: hex(from), toBlock: hex(to) };
    let ins;
    let outs;
    try {
      [ins, outs] = await Promise.all([
        rpc("eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, null, keeper] }]),
        rpc("eth_getLogs", [{ ...range, topics: [TRANSFER_TOPIC, keeper] }]),
      ]);
    } catch (e) {
      return { ledger: next, error: `logs ${from}-${to}: ${e instanceof Error ? e.message : String(e)}` };
    }
    for (const log of ins) if (!log.removed) add(next.inflowBy, fromTopic(log.topics[1]), BigInt(log.data));
    for (const log of outs) if (!log.removed) add(next.outflowBy, fromTopic(log.topics[2]), BigInt(log.data));
    next.scannedTo = to;
    from = to + 1;
  }
  return { ledger: next, error: null };
}

function sumBy(map, addresses) {
  const want = new Set(addresses.map((a) => getAddress(a)));
  let total = 0n;
  for (const [address, amount] of Object.entries(map)) if (want.has(getAddress(address))) total += BigInt(amount);
  return total;
}

/** Fee income is USDC in from the fee sources. Cut paid is USDC out to any creator wallet, past or present. */
export function ledgerTotals(ledger, { feeSources, creatorWallets }) {
  return { feeIncome: sumBy(ledger.inflowBy, feeSources), cutPaid: sumBy(ledger.outflowBy, creatorWallets) };
}

/** Biggest senders first. After launch, the launchpad's fee payer shows up here. */
export function topSenders(ledger, n = 5) {
  return Object.entries(ledger.inflowBy)
    .map(([address, amount]) => ({ address, amount: BigInt(amount) }))
    .sort((a, b) => (a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1))
    .slice(0, n);
}
