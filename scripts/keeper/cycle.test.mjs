import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decodeFunctionData, getAddress } from "viem";
import {
  buildMerkle,
  CREATOR_CUT_BPS,
  CREATOR_WALLET,
  MIN_BUY_USDC,
  MIN_CUT_USDC,
  parseBookTokens,
  planCreatorCut,
  planCycle,
  settleLeg,
  swapCommands,
  USDC,
  verifyProof,
} from "./cycle.mjs";

const NVDA = "0x0000000000000000000000000000000000000a11";
const AAPL = "0x0000000000000000000000000000000000000B0B";
const USYC = "0x8a5D989Bbb96929F689B0200f435f53dA42bF490";
const ALICE = "0x0000000000000000000000000000000000000A11";
const BOB = "0x0000000000000000000000000000000000000B0B";
const CAROL = "0x00000000000000000000000000000000000000C0";

const book = [
  { symbol: "NVDA", address: "0x0000000000000000000000000000000000000a11", weight: 12, kind: "stock", decimals: 18 },
  { symbol: "AAPL", address: AAPL, weight: 10, kind: "stock", decimals: 18 },
  { symbol: "USYC", address: USYC, weight: 2, kind: "cash", decimals: 6 },
  { symbol: "BUIDL", address: "", weight: 3, kind: "cash", decimals: 6 },
];

test("under 150 USDC does not buy", () => {
  const plan = planCycle({ usdc: MIN_BUY_USDC - 1n, book });
  assert.equal(plan.action, "hold");
  assert.equal(plan.legs.length, 0);
  assert.equal(plan.unspent, MIN_BUY_USDC - 1n);
  assert.deepEqual(swapCommands(plan), []);
});

test("an empty book leaves the USDC sitting", () => {
  const plan = planCycle({ usdc: 200n * 1_000_000n, book: [] });
  assert.equal(plan.action, "hold");
  assert.equal(plan.unspent, 200n * 1_000_000n);
});

test("configured weights are bought and the rest stays USDC", () => {
  const usdc = 200n * 1_000_000n;
  const plan = planCycle({ usdc, book });
  assert.equal(plan.action, "buy");
  assert.deepEqual(
    plan.legs.map((leg) => [leg.symbol, leg.amountIn]),
    [
      ["NVDA", 24n * 1_000_000n],
      ["AAPL", 20n * 1_000_000n],
      ["USYC", 4n * 1_000_000n],
    ],
  );
  assert.equal(plan.unspent, 152n * 1_000_000n);
  const commands = swapCommands(plan);
  assert.equal(commands.length, 3);
  assert.match(commands[0].command, /--amount 24$/);
  assert.match(commands[2].command, /--to 0x8a5D989Bbb96929F689B0200f435f53dA42bF490/);
});

test("weights over 100 are refused", () => {
  assert.throws(
    () =>
      planCycle({
        usdc: 200n * 1_000_000n,
        book: [{ symbol: "NVDA", address: NVDA, weight: 101, kind: "stock", decimals: 18 }],
      }),
    /exceed 100/,
  );
});

test("BOOK_TOKENS parses and rejects a bad row", () => {
  const parsed = parseBookTokens("NVDA:0x0000000000000000000000000000000000000a11:12:stock:18");
  assert.equal(parsed[0].symbol, "NVDA");
  assert.equal(parsed[0].weight, 12);
  assert.throws(() => parseBookTokens("NVDA:0x0000000000000000000000000000000000000a11:12:stock"), /bad BOOK_TOKENS/);
});

test("book weights still match src/lib/stocks.ts", () => {
  const src = readFileSync(new URL("../../src/lib/stocks.ts", import.meta.url), "utf8");
  const rows = [...src.matchAll(/ticker: "([A-Z]+)"[\s\S]*?weight: (\d+)/g)].map((m) => [m[1], Number(m[2])]);
  const sum = rows.reduce((n, row) => n + row[1], 0);
  assert.equal(sum, 100);
  assert.equal(rows.find((row) => row[0] === "NVDA")[1], 12);
  assert.equal(rows.find((row) => row[0] === "USYC")[1], 2);
  assert.equal(rows.find((row) => row[0] === "BUIDL")[1], 3);
});

test("merkle proofs match the distributor leaf and pay pro-rata", () => {
  const holders = [
    { address: ALICE, balance: 25n * 10n ** 18n },
    { address: BOB, balance: 75n * 10n ** 18n },
    { address: CAROL, balance: 0n },
  ];
  const leg = { symbol: "NVDA", address: NVDA, kind: "stock" };
  const settled = settleLeg({ leg, amountOut: 100n * 10n ** 18n, holders });
  assert.equal(settled.payouts.length, 2);
  assert.equal(settled.totalShares, 100n * 10n ** 18n);
  assert.equal(settled.dust, 0n);
  const alice = settled.payouts.find((row) => row.address === getAddress(ALICE));
  const bob = settled.payouts.find((row) => row.address === getAddress(BOB));
  assert.equal(alice.amount, 25n * 10n ** 18n);
  assert.equal(bob.amount, 75n * 10n ** 18n);
  for (const row of settled.payouts) {
    assert.equal(verifyProof(settled.root, row.address, row.share, row.proof), true);
  }
  assert.equal(verifyProof(settled.root, ALICE, 1n, alice.proof), false);

  const open = decodeFunctionData({
    abi: [
      {
        type: "function",
        name: "openRound",
        inputs: [
          { name: "nextRoot", type: "bytes32" },
          { name: "nextStock", type: "address" },
          { name: "shares", type: "uint256" },
          { name: "amount", type: "uint256" },
        ],
      },
    ],
    data: settled.calls[1].data,
  });
  assert.equal(open.args[0], settled.root);
  assert.equal(open.args[2], settled.totalShares);
  assert.equal(open.args[3], 100n * 10n ** 18n);
});

test("three holders leave the division dust in the treasury", () => {
  const tree = buildMerkle([
    { address: ALICE, share: 1n },
    { address: BOB, share: 1n },
    { address: CAROL, share: 1n },
  ]);
  for (let i = 0; i < tree.rows.length; i++) {
    assert.equal(verifyProof(tree.root, tree.rows[i].address, tree.rows[i].share, tree.proofs[i]), true);
  }
  const settled = settleLeg({
    leg: { symbol: "NVDA", address: NVDA, kind: "stock" },
    amountOut: 10n,
    holders: [
      { address: ALICE, balance: 1n },
      { address: BOB, balance: 1n },
      { address: CAROL, balance: 1n },
    ],
  });
  assert.equal(
    settled.payouts.reduce((n, row) => n + row.amount, 0n),
    9n,
  );
  assert.equal(settled.dust, 1n);
});

test("cash is parked through the distributor, not paid to holders", () => {
  const leg = { symbol: "USYC", address: USYC, kind: "cash" };
  const settled = settleLeg({ leg, amountOut: 4n * 1_000_000n, holders: [] });
  assert.equal(settled.kind, "cash");
  assert.equal(settled.calls.length, 1);
  const decoded = decodeFunctionData({
    abi: [
      {
        type: "function",
        name: "depositCash",
        inputs: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
        ],
      },
    ],
    data: settled.calls[0].data,
  });
  assert.equal(decoded.args[0], USYC);
  assert.equal(decoded.args[1], 4n * 1_000_000n);
});

test("two-holder root is the forge vector", () => {
  const tree = buildMerkle([
    { address: ALICE, share: 25n },
    { address: BOB, share: 75n },
  ]);
  assert.equal(tree.proofs[0].length, 1);
  assert.equal(tree.proofs[1].length, 1);
  assert.equal(verifyProof(tree.root, ALICE, 25n, tree.proofs[0]), true);
  assert.equal(verifyProof(tree.root, BOB, 75n, tree.proofs[1]), true);
});

const U = 1_000_000n;
const transferAbi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
];

test("the creator gets 10% of launch-fee USDC", () => {
  const cut = planCreatorCut({ feeIncome: 1_000n * U, cutPaid: 0n, balance: 1_000n * U });
  assert.equal(cut.owed, 100n * U);
  assert.equal(cut.send, 100n * U);
  assert.equal(cut.call.to, USDC);
  const decoded = decodeFunctionData({ abi: transferAbi, data: cut.call.data });
  assert.equal(decoded.args[0], getAddress("0x26bd491560b5175ee8bd1da4998fe260ffc413c9"));
  assert.equal(decoded.args[1], 100n * U);
  assert.match(cut.call.command, /--fn transfer --args 0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9,100000000$/);
});

test("USDC left over between ticks is not cut twice", () => {
  // Tick 1: 1,000 USDC of fees. Cut 100, the book spends 400 of the 900.
  let feeIncome = 1_000n * U;
  let cutPaid = 0n;
  let balance = 1_000n * U;
  let cut = planCreatorCut({ feeIncome, cutPaid, balance });
  assert.equal(cut.send, 100n * U);
  cutPaid += cut.send;
  balance -= cut.send + 400n * U;

  // Tick 2: no new fees. 500 is still sitting there. Nothing is owed.
  cut = planCreatorCut({ feeIncome, cutPaid, balance });
  assert.equal(cut.owed, 0n);
  assert.equal(cut.reserved, 0n);
  assert.equal(cut.call, null);

  // Tick 3: 500 more in fees. Only the new 50 is owed.
  feeIncome += 500n * U;
  balance += 500n * U;
  cut = planCreatorCut({ feeIncome, cutPaid, balance });
  assert.equal(cut.send, 50n * U);
  cutPaid += cut.send;
  assert.equal(cutPaid, (feeIncome * CREATOR_CUT_BPS) / 10_000n);
});

test("the book plans from what is left after the cut", () => {
  const usdc = 1_000n * U;
  const cut = planCreatorCut({ feeIncome: usdc, cutPaid: 0n, balance: usdc });
  const plan = planCycle({ usdc: usdc - cut.reserved, book });
  assert.equal(plan.legs.find((leg) => leg.symbol === "NVDA").amountIn, 108n * U);
  const spent = plan.legs.reduce((n, leg) => n + leg.amountIn, 0n);
  assert.equal(cut.reserved + spent + plan.unspent, usdc);
});

test("the cut never sends more than the wallet holds; the rest stays owed", () => {
  const cut = planCreatorCut({ feeIncome: 1_000n * U, cutPaid: 0n, balance: 40n * U });
  assert.equal(cut.owed, 100n * U);
  assert.equal(cut.reserved, 40n * U);
  assert.equal(cut.send, 40n * U);
});

test("a cut under 1 USDC waits but stays reserved from the book", () => {
  const cut = planCreatorCut({ feeIncome: 5n * U, cutPaid: 0n, balance: 200n * U });
  assert.equal(cut.owed, 500_000n);
  assert.ok(cut.owed < MIN_CUT_USDC);
  assert.equal(cut.send, 0n);
  assert.equal(cut.call, null);
  assert.equal(cut.reserved, 500_000n);
});

test("a ledger that is behind reserves the cut but sends nothing", () => {
  const cut = planCreatorCut({ feeIncome: 1_000n * U, cutPaid: 0n, balance: 1_000n * U, current: false });
  assert.equal(cut.reserved, 100n * U);
  assert.equal(cut.send, 0n);
  assert.equal(cut.call, null);
});

test("rounding favors holders", () => {
  const cut = planCreatorCut({ feeIncome: 999_999n, cutPaid: 0n, balance: 999_999n, minCut: 0n });
  assert.equal(cut.entitled, 99_999n);
});

test("a cut outside 0-100% is refused", () => {
  assert.throws(() => planCreatorCut({ feeIncome: 1n, cutPaid: 0n, balance: 1n, bps: 10_001n }), /out of range/);
});

test("creator cut matches src/lib", () => {
  const keeperTs = readFileSync(new URL("../../src/lib/keeper.ts", import.meta.url), "utf8");
  const feesTs = readFileSync(new URL("../../src/lib/fees.ts", import.meta.url), "utf8");
  assert.match(keeperTs, new RegExp(`CREATOR_CUT_WALLET = getAddress\\("${CREATOR_WALLET}"\\)`));
  assert.equal(CREATOR_CUT_BPS, 1_000n);
  assert.match(feesTs, /CREATOR_CUT_BPS = 1_000;/);
});
