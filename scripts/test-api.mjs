import assert from "node:assert/strict";

const base = process.env.STONKFOLIO_BASE || "http://localhost:3042";

async function get(path, headers = {}) {
  const res = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { res, json, text };
}

const book = await get("/api/book");
assert.equal(book.res.status, 200, "book should be free");
assert.equal(book.json.chainId, 5042);
assert.equal(book.json.keeper.kind, "circle-agent-wallet");
assert.match(book.json.keeper.address, /^0x80aa/i);
assert.ok(["park", "buy", "hold"].includes(book.json.keeper.plan.action));
assert.ok(book.json.stocks.length >= 10);

const nav = await get("/api/nav");
assert.equal(nav.res.status, 402, "nav unpaid is 402");
assert.ok(nav.res.headers.get("payment-required"), "PAYMENT-REQUIRED header");
assert.equal(nav.json.error, "PAYMENT_REQUIRED");
assert.match(nav.json.payTo, /^0x0e56/i);

const dist = await get("/api/distributions");
assert.equal(dist.res.status, 402, "distributions unpaid is 402");

const signed = await get("/api/nav", { "PAYMENT-SIGNATURE": "e30=" }); // "{}"
assert.equal(signed.res.status, 402, "signature without settle still 402");

const earn = await get("/api/earn/vaults");
assert.ok([200, 502].includes(earn.res.status), "earn route answers");
if (earn.res.status === 200) {
  assert.ok(Array.isArray(earn.json.vaults));
  console.log("earn vaults", earn.json.vaults.length, earn.json.chain);
}

const market = await get("/api/marketplace");
assert.equal(market.res.status, 200);
assert.equal(market.json.resources.length, 3);
assert.match(market.json.payTo, /^0x0e56/i);

const spec = await get("/api/openapi");
assert.equal(spec.res.status, 200);
assert.ok(spec.json.paths["/api/book"]);
assert.ok(spec.json.paths["/api/nav"]);

const keep = await get("/api/keeper/status");
assert.ok([200, 502].includes(keep.res.status));
console.log("keeper", keep.json.keeper, keep.json.ok, keep.json.balances || keep.json.reason);

console.log("API OK");
