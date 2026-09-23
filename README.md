# Stonkfolio

Arc-native stock folio. $SFOLIO launches on [eve.fun](https://www.eve.fun) Instant. Creator USDC buys a curated RWA book. 5% stays in USYC and BUIDL. Holders see those stocks on the distributions board.

## Loop

1. Creator preset on eve.fun: 1B $SFOLIO / USDC, Uniswap **v4**, LP locked, 1% pool fee.
2. Fee card: creator **70** · burn **10** · holders **0** · auto-LP **10** · eve.fun **10**.
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

`/api/dinari/stocks` reads those server-side and prefers Arc (`eip155:5042`) token addresses when present. Sandbox currently returns non-Arc chains only — "Test data only" is correct. Production keys need KYB, then set `DINARI_ENVIRONMENT=production` on Vercel (Project → Settings → Environment Variables). Never use `NEXT_PUBLIC_` for these. Until Arc CAs appear in the production stock list (or an official registry), `stocks.ts` keeps `address: null` for equities — do not invent addresses.

## Stack

Next.js 16 · Tailwind 4 · wagmi/viem on Arc (`5042`, gas USDC) · `@dinari/api-sdk` (sandbox).
