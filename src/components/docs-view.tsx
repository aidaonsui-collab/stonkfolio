import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";

export function DocsView() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-[13px] tracking-[0.18em] text-[#8a8a8a] uppercase">/ Docs /</p>
      <h1 className="display mt-3 text-[42px] text-[#111] sm:text-6xl">How it works.</h1>
      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-[#3f3f3f]">
        <section>
          <h2 className="text-xl font-semibold text-[#111]">The loop</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              Launch $STONK on{" "}
              <a className="underline" href={EVE_LAUNCH} target="_blank" rel="noreferrer">
                eve.fun Instant
              </a>
              . Full 1B float on Uniswap V3, quoted in Arc USDC, LP locked.
            </li>
            <li>
              Instant takes a 1% pool fee. Quote-side USDC splits creator 50 · Crucible 30 · project burn 10 · platform 10 (referrer 5 folds as documented on the pad). The launch-token side burns.
            </li>
            <li>
              Point the Instant <strong>rewards wallet</strong> at the Stonkfolio keeper. That 50% creator USDC is the only input.
            </li>
            <li>
              After Arc public RWAs list (Circle window Sept 16), the keeper buys the curated basket and distributes the stocks to $STONK holders.
            </li>
            <li>
              Holders farm those stocks on the venues Arc posted: Morpho (isolated + Midnight), Aave V4 (core hub + tokenized spoke), Uniswap on Arc.
            </li>
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[#111]">Why Instant, not Reflection</h2>
          <p className="mt-3">
            Reflection already pays holders 20% of quote-side USDC. Stonkfolio wants that USDC converted into equities instead. Instant keeps the creator leg intact so the keeper can buy the book. Holders are paid in stocks, not a second USDC stream.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[#111]">What is live today</h2>
          <p className="mt-3">
            The pad ({TOKEN.launchpad}) is live on Arc 5042. Public tokenized stocks, BUIDL, and the Morpho / Aave deployments are still in the Circle window. This app shows the holder dashboard and the yield board in the formats they will use. Preview mode fills the tables with sample size so the UI can ship before the names do.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[#111]">Venues</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Uniswap on Arc — @arc, 17 Aug 2026. Same AMM eve.fun already uses.</li>
            <li>Morpho / Midnight — @arc, 26 Aug and 3 Sep 2026. Isolated markets, fixed-rate terms.</li>
            <li>Aave V4 — @arc, 8–10 Sep 2026. USDC / EURC / cirBTC hub plus a tokenized spoke.</li>
          </ul>
        </section>
        <p>
          Pad docs:{" "}
          <a className="underline" href={`${EVE_FUN}/docs`} target="_blank" rel="noreferrer">
            eve.fun/docs
          </a>
          .
        </p>
      </div>
    </div>
  );
}
