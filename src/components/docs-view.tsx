import Link from "next/link";
import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";
import { FEE_LEGS, LAUNCH, pctOfFee } from "@/lib/fees";
import { EVE_AGENT_WALLET } from "@/lib/keeper";
import { shortAddr } from "@/lib/format";

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
              {`Launch $${TOKEN.symbol} on `}
              <a className="text-fg underline-offset-2 hover:underline" href={EVE_LAUNCH} target="_blank" rel="noreferrer">
                eve.fun
              </a>{" "}
              with the <strong className="text-fg">Creator</strong> fee preset, Uniswap v4, TOKEN/USDC, 1B supply, LP locked. Pool fee {LAUNCH.feeBps / 100}%.
            </li>
            <li>
              Fee card: Creator {pctOfFee(LAUNCH.split.creatorBps)} · Burn {pctOfFee(LAUNCH.split.burnBps)} · Holders {pctOfFee(LAUNCH.split.holdersBps)} · Auto-LP {pctOfFee(LAUNCH.split.autoLpBps)} · eve.fun {pctOfFee(LAUNCH.split.platformBps)}. There is no Keeper row. Creator is the keeper.
            </li>
            <li>
              Creator rewards go to the Circle agent wallet on{" "}
              <Link href="/keeper" className="text-fg underline-offset-2 hover:underline">
                the keeper page
              </Link>
              . That 70% of the 1% pool fee is USDC.
            </li>
            <li>
              The keeper parks a cash sleeve in USYC and buys the book. Holders receive stocks — not a USDC reflect.
            </li>
            <li>
              Holders can farm those stocks on Morpho, Aave V4, and Uniswap, or put idle USDC in Circle Earn vaults on{" "}
              <Link href="/yield" className="text-fg underline-offset-2 hover:underline">
                Yield
              </Link>
              .
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Fee card</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {FEE_LEGS.map((leg) => (
              <li key={leg.key}>
                <strong className="text-fg">
                  {leg.label} {pctOfFee(leg.bps)}
                </strong>
                {" · "}
                {leg.hint}
              </li>
            ))}
          </ul>
          <p className="mt-3">
            {`On a $100 swap the trader pays $1. The keeper gets $0.70, keeps the cash sleeve in USYC, and buys stocks. $0.10 burns $${TOKEN.symbol}. $0.10 stays as LP. $0.10 is eve.fun. Holders get 0% as USDC on this card.`}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Creator vs Holders</h2>
          <p className="mt-3">
            {`Holders on the eve.fun card is a USDC reflect, pro rata $${TOKEN.symbol}. That is not how this folio pays. The stock buy is the Creator row, paid to the rewards wallet. Use the Creator preset (70%) so fees become dShares for holders.`}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">The keeper</h2>
          <p className="mt-3">
            The rewards wallet is a Circle agent wallet on Arc ({shortAddr(EVE_AGENT_WALLET)}). Instant USDC lands there, parks in Hashnote USYC (the cash sleeve of the book), then buys listed names. Holders see those fills on Portfolio.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Yield</h2>
          <p className="mt-3">
            Two boards. Stock markets (Morpho, Aave V4, Uniswap) are for names the keeper bought. Circle Earn is Morpho USDC and EURC vaults — optional idle cash, not a second rewards stream. Supply and withdraw from your wallet on the vault card; the keeper never touches this path.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">For agents</h2>
          <p className="mt-3">
            <code className="font-mono text-fg">GET /api/book</code> is free: weights, listing status, keeper address.{" "}
            <code className="font-mono text-fg">GET /api/nav</code> and <code className="font-mono text-fg">GET /api/distributions</code> are paid in USDC on Arc (x402). Catalog: <code className="font-mono text-fg">GET /api/openapi</code>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl italic tracking-tight text-fg">Venues</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>{`eve.fun Instant · Uniswap v4 · $${TOKEN.symbol}/USDC`}</li>
            <li>Circle agent wallet · creator USDC and USYC park</li>
            <li>Dinari dShares · the book the keeper buys</li>
            <li>Morpho, Aave V4, Uniswap · farm the stocks</li>
            <li>Circle Earn Kit · USDC/EURC vaults on Yield</li>
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
