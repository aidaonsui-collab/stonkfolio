import Link from "next/link";
import { TOKEN } from "@/lib/chain";
import { CREATOR_CUT_BPS, FEE_LEGS, LAUNCH, pctOfFee } from "@/lib/fees";

/** On a $1 fee: the creator's share of the rewards leg, and what is left for the book. */
const CREATOR_PER_DOLLAR = (LAUNCH.split.creatorBps * CREATOR_CUT_BPS) / 10_000 / 10_000;
const BOOK_PER_DOLLAR = LAUNCH.split.creatorBps / 10_000 - CREATOR_PER_DOLLAR;

const STEPS = [
  {
    n: "01",
    title: `People trade $${TOKEN.symbol}`,
    body: "Trades go through the $SFOLIO/USDC pool.",
    stat: "USDC",
  },
  {
    n: "02",
    title: "1% comes off the trade",
    body: `${pctOfFee(LAUNCH.split.creatorBps)} of that fee is USDC to the keeper. The creator gets ${pctOfFee(CREATOR_CUT_BPS)} of it. The rest is for the book. ${pctOfFee(LAUNCH.split.platformBps)} is the platform.`,
    stat: "1%",
  },
  {
    n: "03",
    title: "The keeper buys stocks",
    body: "The keeper buys once fee USDC reaches 150. Most of it buys the names in the book. 5% stays in USYC and BUIDL.",
    stat: "THE BOOK",
  },
  {
    n: "04",
    title: "Holders get the stocks",
    body: `The book sends them to $${TOKEN.symbol} wallets. Your share matches how much you hold. Nothing to claim.`,
    stat: "YOUR WALLET",
  },
] as const;

const FAQ = [
  {
    q: "Where do the stocks arrive?",
    a: "In your wallet. Portfolio shows the same stocks.",
  },
  {
    q: "How much do I get?",
    a: `On the book, the same share of each stock as your share of $${TOKEN.symbol}. If you signed one name, that share buys only that name.`,
  },
  {
    q: "Can I choose a stock?",
    a: "Yes. Open Folio and sign one name from the book, including SPY, for the next cycle. USYC and BUIDL stay in the book. No signature means you receive every name.",
  },
  {
    q: "When does a choice count?",
    a: "On the next cycle. A cycle that has already opened keeps the choices it froze.",
  },
  {
    q: "Who is paid?",
    a: `A wallet that holds at least 0.05% of $${TOKEN.symbol} at one pinned block, after the burn address is removed. The pool, the burn address, and the keeper are left out. A trade after that block does not change the cycle.`,
  },
  {
    q: "What if a name is too small to buy?",
    a: "That name waits. Your USDC for it stays pending. Everyone else is still paid. It is not added to the book.",
  },
  {
    q: "Do I stake or claim?",
    a: `No. Hold $${TOKEN.symbol}. The stocks are sent to you.`,
  },
  {
    q: "Can another app read the book?",
    a: "The list of names is free. A wallet’s stocks and value cost a small USDC payment.",
  },
  {
    q: "Can another app buy the book for its holders?",
    a: "Yes. They send USDC. 5% stays. The rest buys the same stocks, and those stocks go to their holders. $SFOLIO fees do not pay that 5%.",
  },
  {
    q: "Can I earn extra?",
    a: `Yield is optional. Farm the stocks, or put spare USDC in Earn vaults. That is not how the ${pctOfFee(LAUNCH.split.creatorBps)} is paid.`,
  },
] as const;

export function DocsView() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">How it works</p>
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
              <span className="font-mono text-[11px] tracking-[0.14em] text-accent">{s.n}</span>
              <div className="min-w-0">
                <p className="font-medium text-fg">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-accent">{s.stat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl italic tracking-tight">On a $100 trade</h2>
        <p className="mt-3 text-sm text-muted">You pay $1. It splits like this.</p>
        <ul className="mt-5 divide-y divide-border">
          {FEE_LEGS.map((leg) => (
            <li key={leg.key} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-muted">{leg.label}</span>
              <span className="font-medium">${(leg.bps / 10_000).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          {`Of the $${(LAUNCH.split.creatorBps / 10_000).toFixed(2)}, $${CREATOR_PER_DOLLAR.toFixed(2)} goes to the creator and $${BOOK_PER_DOLLAR.toFixed(2)} buys the book.`}
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
        .
      </p>
    </div>
  );
}
