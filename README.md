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
npm run dev
```

- `/` how it works
- `/distributions` holder dashboard (theindex-style)
- `/yield` farm board (clutch/anvil-style)
- `/basket` curator weights
- `/docs` fee path and venues

**Preview** in the header fills the boards with sample size so the UI can ship before RWAs do. Preview deposits stay in `localStorage`. Nothing routes on-chain until issuer tokens and Morpho/Aave/Uniswap are public on chain 5042.

## Stack

Next.js 16 · Tailwind 4 · wagmi/viem on Arc (`5042`, gas USDC).
