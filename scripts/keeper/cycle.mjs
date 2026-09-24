/**
 * Off-chain keeper cycle. Plans a buy from fee USDC, then builds the
 * treasury transfer and the distributor round. It does not sign or broadcast.
 *
 * Weights are percents of the wallet's USDC and must sum to at most 100.
 * A name with no address is left as unspent USDC. Do not put a stocks.ts
 * address into BOOK_TOKENS unless that row is tradeable (Dinari Arc dShares
 * are deployed-unminted / tradeable:false until mint). Cash names are parked
 * through FolioDistributor.depositCash. Stock names are transferred into
 * FolioTreasury, then paid out with openRound + deliver.
 *
 * The merkle leaf matches FolioDistributor: keccak256(bytes.concat(keccak256(abi.encode(holder, share)))).
 */
import { encodeAbiParameters, encodeFunctionData, encodePacked, getAddress, keccak256 } from "viem";

export const MIN_BUY_USDC = 150n * 1_000_000n;
export const USDC = "0x3600000000000000000000000000000000000000";
export const AGENT = "0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F";
export const TREASURY = "0xd47B04A41b3734EAb2687ef01d07881D05F9215e";
export const DISTRIBUTOR = "0x75ff1625d5A94155dD436BcbEA6C09909F048881";

const transferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];

const distributorAbi = [
  {
    type: "function",
    name: "depositCash",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "openRound",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nextRoot", type: "bytes32" },
      { name: "nextStock", type: "address" },
      { name: "shares", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deliver",
    stateMutability: "nonpayable",
    inputs: [
      { name: "holders", type: "address[]" },
      { name: "shares", type: "uint256[]" },
      { name: "proofs", type: "bytes32[][]" },
    ],
    outputs: [],
  },
];

/** SYMBOL:0xaddress:weight:stock|cash:decimals, separated by commas. Blank is an empty book. */
export function parseBookTokens(raw) {
  const text = (raw || "").trim();
  if (!text) return [];
  return text.split(",").map((part) => {
    const bits = part.trim().split(":");
    if (bits.length !== 5) throw new Error(`bad BOOK_TOKENS entry: ${part}`);
    const [symbol, address, weight, kind, decimals] = bits;
    if (kind !== "stock" && kind !== "cash") throw new Error(`bad kind for ${symbol}`);
    const w = Number(weight);
    const d = Number(decimals);
    if (!Number.isInteger(w) || w < 0 || w > 100) throw new Error(`bad weight for ${symbol}`);
    if (!Number.isInteger(d) || d < 0 || d > 18) throw new Error(`bad decimals for ${symbol}`);
    return { symbol, address: getAddress(address), weight: w, kind, decimals: d };
  });
}

function less(a, b) {
  return BigInt(a) < BigInt(b);
}

export function leaf(holder, share) {
  const inner = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [getAddress(holder), share]));
  return keccak256(inner);
}

export function hashPair(a, b) {
  const [x, y] = less(a, b) ? [a, b] : [b, a];
  return keccak256(encodePacked(["bytes32", "bytes32"], [x, y]));
}

export function buildMerkle(entries) {
  const rows = [...entries]
    .map((row) => ({ address: getAddress(row.address), share: BigInt(row.share) }))
    .filter((row) => row.share > 0n)
    .sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1));
  if (rows.length === 0) throw new Error("no holders");
  const leaves = rows.map((row) => leaf(row.address, row.share));
  const layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(i + 1 === prev.length ? prev[i] : hashPair(prev[i], prev[i + 1]));
    }
    layers.push(next);
  }
  const proofs = leaves.map((_, index) => {
    const proof = [];
    let idx = index;
    for (let level = 0; level < layers.length - 1; level++) {
      const layer = layers[level];
      const sibling = idx ^ 1;
      if (sibling < layer.length) proof.push(layer[sibling]);
      idx = Math.floor(idx / 2);
    }
    return proof;
  });
  return { root: layers[layers.length - 1][0], rows, proofs };
}

export function verifyProof(root, holder, share, proof) {
  let h = leaf(holder, share);
  for (const sibling of proof) h = hashPair(h, sibling);
  return h === root;
}

export function formatUnits(amount, decimals) {
  const v = BigInt(amount);
  const s = v.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/**
 * @param {{ usdc: bigint, book: { symbol: string, address: string, weight: number, kind: "stock" | "cash", decimals: number }[], minBuy?: bigint }} args
 */
export function planCycle({ usdc, book, minBuy = MIN_BUY_USDC }) {
  const balance = BigInt(usdc);
  if (balance < minBuy) {
    return { action: "hold", reason: "under 150 USDC", legs: [], unspent: balance };
  }
  const configured = (book || []).filter((row) => row.address && row.weight > 0);
  if (configured.length === 0) {
    return { action: "hold", reason: "no book tokens configured", legs: [], unspent: balance };
  }
  const weightSum = configured.reduce((n, row) => n + BigInt(row.weight), 0n);
  if (weightSum > 100n) throw new Error("book weights exceed 100");
  let spent = 0n;
  const legs = [];
  for (const row of configured) {
    const amountIn = (balance * BigInt(row.weight)) / 100n;
    if (amountIn === 0n) continue;
    spent += amountIn;
    legs.push({
      symbol: row.symbol,
      address: getAddress(row.address),
      weight: row.weight,
      kind: row.kind,
      decimals: row.decimals,
      amountIn,
    });
  }
  if (legs.length === 0) {
    return { action: "hold", reason: "configured weights round to zero", legs: [], unspent: balance };
  }
  return { action: "buy", reason: "buy configured weights, leave the rest", legs, unspent: balance - spent };
}

export function swapCommands(plan, agent = AGENT) {
  if (!plan || plan.action !== "buy") return [];
  return plan.legs.map((leg) => ({
    kind: "swap",
    symbol: leg.symbol,
    to: leg.address,
    amountIn: leg.amountIn,
    command: `circle wallet swap --address ${agent} --chain ARC --from ${USDC} --to ${leg.address} --amount ${formatUnits(leg.amountIn, 6)}`,
  }));
}

/** After a fill, move the tokens and open one payout round per stock. */
export function settleLeg({ leg, amountOut, holders, treasury = TREASURY, distributor = DISTRIBUTOR, minBalance = 0n }) {
  const out = BigInt(amountOut);
  if (out <= 0n) throw new Error(`no ${leg.symbol} received`);
  if (leg.kind === "cash") {
    const data = encodeFunctionData({
      abi: distributorAbi,
      functionName: "depositCash",
      args: [leg.address, out],
    });
    return {
      kind: "cash",
      symbol: leg.symbol,
      amountOut: out,
      calls: [
        {
          to: distributor,
          data,
          command: `circle wallet execute --address ${AGENT} --chain ARC --contract ${distributor} --fn depositCash --args ${leg.address},${out.toString()}`,
        },
      ],
    };
  }
  const selected = (holders || [])
    .map((row) => ({ address: getAddress(row.address), share: BigInt(row.balance ?? row.share) }))
    .filter((row) => row.share > minBalance);
  const tree = buildMerkle(selected);
  const totalShares = tree.rows.reduce((n, row) => n + row.share, 0n);
  const payouts = tree.rows.map((row, i) => ({
    address: row.address,
    share: row.share,
    proof: tree.proofs[i],
    amount: (out * row.share) / totalShares,
  }));
  const paid = payouts.reduce((n, row) => n + row.amount, 0n);
  const transferData = encodeFunctionData({
    abi: transferAbi,
    functionName: "transfer",
    args: [treasury, out],
  });
  const openData = encodeFunctionData({
    abi: distributorAbi,
    functionName: "openRound",
    args: [tree.root, leg.address, totalShares, out],
  });
  const deliverData = encodeFunctionData({
    abi: distributorAbi,
    functionName: "deliver",
    args: [payouts.map((row) => row.address), payouts.map((row) => row.share), payouts.map((row) => row.proof)],
  });
  return {
    kind: "stock",
    symbol: leg.symbol,
    amountOut: out,
    root: tree.root,
    totalShares,
    dust: out - paid,
    payouts,
    calls: [
      { to: leg.address, data: transferData },
      { to: distributor, data: openData },
      { to: distributor, data: deliverData },
    ],
  };
}
