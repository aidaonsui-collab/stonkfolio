# Stonkfolio

Arc-native stock folio. $STONK launches on [eve.fun](https://www.eve.fun) Instant. Creator USDC auto-buys a curated RWA book after Arc public names list (Circle window **16 Sep 2026**). Holders see those stocks on the distributions board. They farm them on Morpho, Aave V4, and Uniswap — the venues [@arc](https://x.com/arc) posted.

## Loop

1. Instant launch on eve.fun: 1B $STONK / USDC, 1% Uniswap V3, LP locked.
2. Quote-side USDC: creator **50** · Crucible 30 · project burn 10 · platform 10.
3. Point the Instant rewards wallet at the Stonkfolio keeper.
4. Keeper buys only the book in `src/lib/stocks.ts`.
5. Stocks distribute to $STONK holders. Yield tab is the clutch-style market grid.

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

Do **not** paste the API secret into the website. Sandbox keys from [partners.dinari.com](https://partners.dinari.com) go in `.env.local`:

```
DINARI_API_KEY_ID=...
DINARI_API_SECRET_KEY=...
DINARI_ENVIRONMENT=sandbox
```

`/api/dinari/stocks` reads those server-side. "Test data only" is correct — sandbox cannot mint real dShares. Production keys need KYB, then set `DINARI_ENVIRONMENT=production` on Vercel (Project → Settings → Environment Variables). Never use `NEXT_PUBLIC_` for these.

## Stack

Next.js 16 · Tailwind 4 · wagmi/viem on Arc (`5042`, gas USDC) · `@dinari/api-sdk` (sandbox).
