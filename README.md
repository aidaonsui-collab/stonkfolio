# Stonkfolio

Arc-native stock folio. $SFOLIO launches on an Instant pad against USDC. Creator USDC buys a curated RWA book. 5% stays in USYC and BUIDL. Holders see those stocks on the distributions board.

## Loop

1. Creator preset: 1B $SFOLIO / USDC, Uniswap **v4**, LP locked, 1% pool fee.
2. Fee card: rewards **80** · platform **20**. Burn, holders, and auto-LP are 0.
3. Creator rewards wallet = Eve's existing Circle Agent Wallet (`0x80aa…e3f`). Same SCA as x402. No second wallet.
4. That USDC buys the book in `src/lib/stocks.ts`. 5% stays in USYC and BUIDL. The keeper checks every 30 minutes on Jessica's Air (`com.stonkfolio.keeper`).
5. `FolioTreasury` distributes stocks to holders. Holders farm on Morpho / Aave / Uniswap, or Circle Earn Kit USDC vaults on `/yield`.
6. `GET /api/book` is free. `GET /api/nav` and `/api/distributions` are x402 (Arc USDC, Eve's Arc Facilitator payTo).

## App

```
npm install
cp .env.example .env.local
npm run dev
```

- `/` how it works
- `/bundles` curator book + Dinari sandbox feed
- `/portfolio` holder desk
- `/yield` farm board
- `/docs` fee path and venues

**Preview** in the header fills the boards with sample size. Preview deposits stay in `localStorage`.

## Dinari keys

Equity/index names in `src/lib/stocks.ts` are issued by **Dinari** on Arc (`eip155:5042`). Cash sleeve (BUIDL / USYC) stays BlackRock / Hashnote.

Do **not** paste the API secret into the website. Sandbox keys from [partners.dinari.com](https://partners.dinari.com) go in `.env.local`:

```
DINARI_API_KEY_ID=...
DINARI_API_SECRET_KEY=...
DINARI_ENVIRONMENT=sandbox
```

`/api/dinari/stocks` reads those server-side and prefers Arc (`eip155:5042`) token addresses when present. Sandbox currently returns non-Arc chains only — "Test data only" is correct. Production keys need KYB, then set `DINARI_ENVIRONMENT=production` on Vercel (Project → Settings → Environment Variables). Never use `NEXT_PUBLIC_` for these.

### Arc dShare contracts (2026-09-24)

Plain dShare + wrapped (`.dw`) addresses in `stocks.ts` were filled from Dinari's Arc diamond `0xf60f689ec22fC2D485b3C734eFE58538cCc28766` (verified `symbol()` / `totalSupply()` on-chain). **Supply is 0** as of Sep 24 2026; there are no Uniswap v3 USDC pools yet. Each equity/index row uses `status: "deployed-unminted"` and **`tradeable: false`**. The keeper and UI gate buys on `tradeable`, not on a non-null `address`. Flip `tradeable` only after mint + a real venue. BE stays without an Arc CA until listed. AMD/COIN CAs filled 2026-09-24 from diamond storage. Do not invent addresses. Keep `KEEPER_LIVE=0` until then.

## Stack

Next.js 16 · Tailwind 4 · wagmi/viem on Arc (`5042`, gas USDC) · `@dinari/api-sdk` (sandbox).
