import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";

export function DocsView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker">The loop</p>
      <h1 className="display-md mt-3">How it works.</h1>
      <div className="mt-10 space-y-12 text-[15px] leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">The path</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5">
            <li>
              Launch $STONK on{" "}
              <a className="text-fg underline-offset-2 hover:underline" href={EVE_LAUNCH} target="_blank" rel="noreferrer">
                eve.fun Instant
              </a>
              . Full 1B float on Uniswap V3, quoted in Arc USDC, LP locked.
            </li>
            <li>
              Instant takes a 1% pool fee. Quote-side USDC splits creator 50 · Crucible 30 · project burn 10 · platform 10. The launch-token side burns.
            </li>
            <li>
              Point the Instant <strong className="text-fg">rewards wallet</strong> at the Stonkfolio keeper. That 50% creator USDC is the only input.
            </li>
            <li>
              After Arc public RWAs list (Circle window Sept 16), the keeper buys the curated bundle and distributes the stocks to $STONK holders.
            </li>
            <li>
              Holders farm those stocks on the venues Arc posted: Morpho (isolated + Midnight), Aave V4 (core hub + tokenized spoke), Uniswap on Arc.
            </li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Why Instant, not Reflection</h2>
          <p className="mt-3">
            Reflection already pays holders 20% of quote-side USDC. Stonkfolio wants that USDC converted into equities instead. Instant keeps the creator leg intact so the keeper can buy the book. Holders are paid in stocks, not a second USDC stream.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">What is live today</h2>
          <p className="mt-3">
            The pad ({TOKEN.launchpad}) is live on Arc 5042. Public tokenized stocks, BUIDL, and the Morpho / Aave deployments are still in the Circle window. This desk shows the holder folio and the yield ladder in the formats they will use. Preview tape fills the ledger with sample size so the UI can ship before the names do.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Venues</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Uniswap on Arc — @arc, 17 Aug 2026. Same AMM eve.fun already uses.</li>
            <li>Morpho / Midnight — @arc, 26 Aug and 3 Sep 2026. Isolated markets, fixed-rate terms.</li>
            <li>Aave V4 — @arc, 8–10 Sep 2026. USDC / EURC / cirBTC hub plus a tokenized spoke.</li>
          </ul>
        </section>
        <p>
          Pad docs:{" "}
          <a className="text-fg underline-offset-2 hover:underline" href={`${EVE_FUN}/docs`} target="_blank" rel="noreferrer">
            eve.fun/docs
          </a>
          .
        </p>
      </div>
    </div>
  );
}
