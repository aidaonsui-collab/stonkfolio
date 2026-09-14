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
              with the <strong className="text-fg">Creator</strong> fee preset, Uniswap v4, TOKEN/USDC, 1B supply, LP locked. Pool fee {LAUNCH.feeBps / 100}%.
            </li>
            <li>
              Fee card: Creator {pctOfFee(LAUNCH.split.creatorBps)} · Burn {pctOfFee(LAUNCH.split.burnBps)} · Holders {pctOfFee(LAUNCH.split.holdersBps)} · Auto-LP {pctOfFee(LAUNCH.split.autoLpBps)} · eve.fun {pctOfFee(LAUNCH.split.platformBps)}. There is no Keeper row. Creator is the keeper.
            </li>
            <li>
              Set <strong className="text-fg">creator rewards</strong> to the Stonkfolio keeper wallet (or an X-handle vault that pays that wallet). That 70% USDC is what buys dShares.
            </li>
            <li>
              After Arc RWAs list, the keeper spends that USDC on the Dinari book and distributes stocks to $STONK holders. Holders farm those on Morpho, Aave V4, and Uniswap.
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
            On a $100 swap the trader pays $1. Creator/keeper gets $0.70 to buy stocks. $0.10 burns $STONK. $0.10 stays as LP. $0.10 is eve.fun. Holders get 0% as USDC on this card. They get the stocks the keeper buys.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Creator vs Holders on the card</h2>
          <p className="mt-3">
            Holders on the fee card is a USDC reflect claim, pro rata $STONK. That is not the stock buy. The stock buy is Creator, paid to the rewards wallet. Use the Creator preset (70%) if the product is fees → dShares → holders.
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
