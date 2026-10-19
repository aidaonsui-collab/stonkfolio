import type { ReactNode } from "react";
import { LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { Button } from "./ui/button";
import { StockMark } from "./stock-mark";

const GAP_BOARD_URL = "https://www.watchevelive.com/blotter";
const GAP_REPLAY_URL = "https://www.watchevelive.com/blotter#gap";
const GAP_SELECTION_URL = "https://www.watchevelive.com/gap";

const NAMES = ["NVDA", "QQQ", "SPY"] as const;

const STEPS: { n: string; body: ReactNode }[] = [
  {
    n: "01",
    body: "Eve posts a next-open paper call (direction only — method not shared).",
  },
  {
    n: "02",
    body: (
      <>
        Agents and people pull the current selection via <span className="font-mono text-fg">GET /gap</span>{" "}
        ($50 USDC over x402).
      </>
    ),
  },
  {
    n: "03",
    body: "Nothing here spends your wallet or places a live trade.",
  },
];

export function HomeView() {
  return (
    <div>
      <section className="page pb-8 sm:pb-8">
        <div className="stagger-in flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="kicker text-accent">Gap</p>
            <h1 className="display mt-3 text-fg">Stonkfolio</h1>
            <p className="mt-4 font-display text-[clamp(1.55rem,0.9rem+1.6vw,2.35rem)] italic leading-tight tracking-tight text-accent">
              Next-open paper calls on stock tokens.
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Eve’s Gap board for NVDA, QQQ, and SPY stock tokens — scoreboard only. Pay for tonight’s
              selection, or read the free replay and judge it yourself.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={GAP_BOARD_URL}>Open Gap board</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={GAP_SELECTION_URL}>Pay for current selection</a>
              </Button>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              Current selection is <span className="font-mono text-fg">GET /gap</span> · $50 USDC over x402.
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-3">
          <p className="kicker">Names on the board</p>
          <p className="text-xs text-muted">Scoreboard only</p>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {NAMES.map((ticker) => (
            <li key={ticker} className="panel-tight flex items-center gap-3 p-4">
              <StockMark
                stock={{ ticker, letter: ticker.slice(0, 1), name: `${ticker} stock token` }}
                size={40}
              />
              <div className="min-w-0">
                <p className="font-mono text-sm">{ticker}</p>
                <p className="mt-1 text-xs text-muted">Stock token · paper call</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="page pt-4">
        <h2 className="display-md">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="panel-tight p-5">
              <span className="font-mono text-xs tracking-widest text-accent">{step.n}</span>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <section className="panel mt-10 p-5 sm:p-8" aria-labelledby="replay-heading">
          <h2 id="replay-heading" className="font-display text-3xl italic tracking-tight">
            Replay
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Free September track record on the Gap blotter so you can see how it scored. Tonight’s pick is
            not included in the free board.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            This page does not reprint scores. Open Eve’s free replay and judge it yourself.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <a href={GAP_REPLAY_URL}>Open the free replay</a>
            </Button>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="kicker">
            Disclaimers
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Not advice. Paper tickets against live marks. Not affiliated with Robinhood. Built with Eve on
            Vercel; payments settle in USDC over x402.
          </p>
        </section>

        <p className="mt-8 text-sm text-muted">
          <span className="text-fg">{LEGAL_NAME}</span>
          <span aria-hidden="true"> · </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-fg underline-offset-2 hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  );
}
