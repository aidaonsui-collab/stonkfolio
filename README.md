# Stonkfolio

Arc-native stock folio. $SFOLIO launches on an Instant pad against USDC. Creator USDC buys a curated RWA book. 5% of that USDC farms in Circle Earn on Morpho. Holders see those stocks on the distributions board.

## Loop

1. Creator preset: 1B $SFOLIO / USDC, Uniswap **v4**, LP locked, 1% pool fee.
2. Fee card: rewards **80** · platform **20**. Burn, holders, and auto-LP are 0.
3. Creator rewards wallet = Eve's existing Circle Agent Wallet (`0x80aa…e3f`). Same SCA as x402. No second wallet.
4. 10% of the launch-fee USDC that reaches the keeper goes to the creator wallet (`0x26bD…13c9`). The rest buys the book in `src/lib/stocks.ts`. 5% of that USDC farms in Circle Earn on Morpho. The keeper checks every 30 minutes on Jessica's Air (`com.stonkfolio.keeper`).
5. `FolioTreasury` distributes stocks to holders. Holders farm on Morpho / Aave / Uniswap, or Circle Earn Kit USDC vaults on `/yield`.
6. `GET /api/book` is free. `GET /api/nav` and `/api/distributions` are x402 (Arc USDC, Eve's Arc Facilitator payTo).

## App

```
npm install
cp .env.example .env.local
npm run dev
```

- `/` how it works
- `/bundles` curator book of xStocks (not yet on Arc)
- `/portfolio` holder desk
- `/yield` farm board
- `/docs` fee path and venues

**Preview** in the header fills the boards with sample size. Preview deposits stay in `localStorage`.

## xStocks (tokenized equities)

Equity/index names in `src/lib/stocks.ts` are planned as **xStocks** (Backed / Payward, [xstocks.fi](https://xstocks.fi)). The cash sleeve is USDC deposited in Circle Earn (Morpho). It is not USYC or BUIDL.

**Status (checked 2026-10-01): xStocks are not deployed on Arc (`eip155:5042`).** The public catalog at `https://api.xstocks.fi/api/v2/public/assets` lists every book name (AAPLx, MSFTx, NVDAx, GOOGLx, AMZNx, METAx, TSLAx, SPYx, CRCLx, COINx, AMDx, BEx) but no product has an Arc deployment. Every equity/index row therefore has `address: null`, `status: "announced"` and **`tradeable: false`**. The keeper and UI gate buys on `tradeable`, not on a non-null `address`. Fill `address` only from an issuer-published Arc deployment, and flip `tradeable` only after supply and a real venue exist. Do not invent addresses. Keep `KEEPER_LIVE=0` until then.

`GET /api/xstocks/assets` reads the public catalog (no API key) and reports, per book name, which networks list it and whether an Arc address appears. It needs no secrets.

## Borrow (Circle Borrow Kit)

`/yield` lists Circle Borrow Kit markets on Arc (Morpho Blue): borrow USDC or EURC against cirBTC, WETH, XAUM, and a few stable collaterals, from the user's own wallet. Quotes show collateral, health factor, and liquidation price before signing. Open loans can be repaid and closed from the same section.

- **Fee.** Each borrow carries a 0.25% origination fee (`BORROW_FEE_BPS` in `src/lib/borrow.ts`) paid to the Arcfun platform wallet `0x26bD…13c9` (owner and treasury of the live Arcfun Instant factory).
- **How the fee attaches.** The browser kit talks to `/v1/borrowKit/*` on this site, which forwards to `api.circle.com` and adds `CIRCLE_API_KEY` only on `loans/borrow` and `loans/borrow/quote`. `integrators/*` is never proxied, so nobody can change the fee through the site. Without the key, borrowing still works with no fee.
- **One-time setup.** Put `CIRCLE_API_KEY` in `.env.local` and on Vercel, then run `node --env-file=.env.local scripts/borrow/set-integrator-fee.mjs` (`--check` reads the current setting). The script reads the rate and wallet from `src/lib/borrow.ts`.

## Creator cut

The keeper owes the creator wallet 10% of every launch-fee USDC that has ever reached it, less what that wallet was already sent. Leftover USDC carried between ticks is never cut twice. The owed amount comes off the book's budget before `planCycle` runs, and the tick writes the transfer as a `circle wallet execute … --fn transfer` command. Like the buys, it does not broadcast.

- Fee income counts only USDC from `FEE_SOURCES`, since the agent wallet also takes Eve's payments. After launch, find the launchpad contract that pays the keeper under `ledger.topSenders` in `data/keeper-status.json`, then set `FEE_SOURCES` in `.env.local`. Until then no cut is planned.
- `data/keeper-ledger.json` keeps running totals of USDC in (per sender) and out (per recipient). The public Arc RPC prunes logs older than about a day, so this file is the record. Do not delete it. If the keeper is down for more than a day, set `ARC_LOGS_RPC` to an archive node to fill the gap.
- While the ledger is behind or errors, the cut stays reserved but nothing is sent.
- To change the wallet, edit `CREATOR_WALLET` in `scripts/keeper/cycle.mjs` and `CREATOR_CUT_WALLET` in `src/lib/keeper.ts`, and move the old address into `PAST_CREATOR_WALLETS` so its payments still count.

## Stack

Next.js 16 · Tailwind 4 · wagmi/viem on Arc (`5042`, gas USDC).

## Swap (`/swap`)

Routes through Uniswap v3 and v4 on Arc (5042) and picks the better output. No Stonkfolio fee, non-custodial.
- v3: SwapRouter02 + QuoterV2 (direct and 2-hop). v4: V4Quoter + Universal Router (`V4_SWAP`: `SWAP_EXACT_IN_SINGLE`, `SETTLE_ALL`, `TAKE_ALL`) with Permit2 (exact-amount, 30-minute approvals). v4 is single-hop, no-hook pools only.
- v4 has no factory: pools are found by asking StateView for the standard fee/tickSpacing pairs plus `src/lib/v4-pools.ts` (from `scripts/swap/v4-scan.mts`). If no v4 pool has liquidity, or v4 reads fail, the router silently uses v3 only.
- Tests: `npm run test:swap` (offline), `npm run test:swap:live` (read-only Arc calls, no transactions).
