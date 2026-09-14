import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";
import { FEE_LEGS, LAUNCH, pctOfFee } from "@/lib/fees";

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
                eve.fun
              </a>{" "}
              as <strong className="text-fg">Reflect</strong>, Uniswap v4, TOKEN/USDC, 1B supply, LP locked. Set the pool fee to {LAUNCH.feeBps / 100}%.
            </li>
            <li>
              On the fee card set Custom: Holders {pctOfFee(LAUNCH.split.holdersBps)} · Keeper/creator {pctOfFee(LAUNCH.split.creatorBps)} · eve.fun {pctOfFee(LAUNCH.split.platformBps)}. Burn 0. Auto-LP 0. Platform cannot go below 10%.
            </li>
            <li>
              Point the <strong className="text-fg">creator rewards wallet</strong> at the Stonkfolio keeper. That 20% is the only USDC that buys dShares.
            </li>
            <li>
              Holder USDC is not streamed per swap. The pad keeper collects the locked v4 position, forwards USDC, then calls <code className="font-mono text-fg">reflect()</code>. Claim from eve.fun Profile or this desk once we index claims.
            </li>
            <li>
              After Arc RWAs list, the keeper spends the creator slice on the Dinari book and distributes stocks. Holders farm those on Morpho, Aave V4, and Uniswap.
            </li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Fee card</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {FEE_LEGS.map((leg) => (
              <li key={leg.key}>
                <strong className="text-fg">{leg.label} {pctOfFee(leg.bps)}</strong>
                {" · "}
                {leg.hint}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            On a $100 swap the trader pays $1. Holders share $0.70. The keeper gets $0.20 to buy stocks. eve.fun gets $0.10. Same cut on buys and sells.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Why Reflect, not Meme</h2>
          <p className="mt-3">
            Meme Instant can send the whole fee to creator, burn, or the pool. Reflect is the type that pays holders, with a 20% floor on that slice. 70% is a custom Reflect card. Holders get USDC. The 20% creator slice still funds the stock book. Two legs, one token.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">What is live today</h2>
          <p className="mt-3">
            The pad ({TOKEN.launchpad}) is live on Arc 5042. Dinari sandbox lists the basket. Public Arc dShares, BUIDL, and Morpho / Aave are still in the Circle window. Preview tape fills the desk with sample size.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Venues</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Uniswap v4 on Arc. The launch pool and later stock/USDC LPs.</li>
            <li>Morpho / Midnight. Isolated markets, fixed-rate terms.</li>
            <li>Aave V4. USDC / EURC / cirBTC hub plus a tokenized spoke.</li>
            <li>Dinari dShares. Fill path for the 20% keeper slice.</li>
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
