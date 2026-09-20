import Link from "next/link";
import { EVE_FUN, EVE_LAUNCH, TOKEN } from "@/lib/chain";

const STEPS = [
  {
    n: "01",
    title: `People trade $${TOKEN.symbol}`,
    body: "Trades go through the eve.fun pool against USDC.",
    stat: "EVE.FUN",
  },
  {
    n: "02",
    title: "1% comes off the trade",
    body: "70% of that fee is USDC for the book. The rest burns, stays as LP, or goes to eve.fun.",
    stat: "1%",
  },
  {
    n: "03",
    title: "The keeper buys stocks",
    body: "That USDC buys the names in the bundle. A slice stays in USYC.",
    stat: "THE BOOK",
  },
  {
    n: "04",
    title: "Holders get the stocks",
    body: `Tokens land in $${TOKEN.symbol} wallets. Nothing to claim.`,
    stat: "YOUR WALLET",
  },
] as const;

const FAQ = [
  {
    q: "Where do the stocks arrive?",
    a: "In your wallet. Portfolio shows the same fills.",
  },
  {
    q: "Do I stake or claim?",
    a: `No. Hold $${TOKEN.symbol}. Distributions are pushed.`,
  },
  {
    q: "Why is Holders 0% on eve.fun?",
    a: "That row would pay USDC. This folio pays stocks instead, using the Creator row.",
  },
  {
    q: "Can I earn extra?",
    a: "Yield is optional. Farm the stocks, or put idle USDC in Earn vaults. It is not how the 70% is paid.",
  },
] as const;

export function DocsView() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker">How it works</p>
      <h1 className="display-md mt-3">
        How distributions
        <br />
        work.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Trade $SFOLIO. Fees buy stocks. Stocks go to holders.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl italic tracking-tight">Process</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="panel-tight flex gap-4 p-5">
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted">{s.n}</span>
              <div className="min-w-0">
                <p className="font-medium text-fg">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted">{s.stat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl italic tracking-tight">On a $100 trade</h2>
        <p className="mt-3 text-sm text-muted">You pay $1. It splits like this.</p>
        <ul className="mt-5 divide-y divide-border">
          <li className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-muted">Stocks for holders</span>
            <span className="font-medium">$0.70</span>
          </li>
          <li className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-muted">Burn</span>
            <span className="font-medium">$0.10</span>
          </li>
          <li className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-muted">Stays in the pool</span>
            <span className="font-medium">$0.10</span>
          </li>
          <li className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-muted">eve.fun</span>
            <span className="font-medium">$0.10</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted">
          Launch on{" "}
          <a className="text-fg underline-offset-2 hover:underline" href={EVE_LAUNCH} target="_blank" rel="noreferrer">
            eve.fun
          </a>
          . Point creator rewards at the{" "}
          <Link href="/keeper" className="text-fg underline-offset-2 hover:underline">
            keeper
          </Link>
          .
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl italic tracking-tight">Questions</h2>
        <dl className="mt-6 divide-y divide-border">
          {FAQ.map((item) => (
            <div key={item.q} className="py-4">
              <dt className="font-medium text-fg">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-14 text-sm text-muted">
        Names and weights:{" "}
        <Link href="/bundles" className="text-fg underline-offset-2 hover:underline">
          Bundles
        </Link>
        . Farm:{" "}
        <Link href="/yield" className="text-fg underline-offset-2 hover:underline">
          Yield
        </Link>
        {" · "}
        <a className="text-fg underline-offset-2 hover:underline" href={`${EVE_FUN}/docs`} target="_blank" rel="noreferrer">
          eve.fun docs
        </a>
        .
      </p>
    </div>
  );
}
