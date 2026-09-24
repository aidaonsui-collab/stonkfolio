"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ARC_EXPLORER, ARC_USDC_ERC20 } from "@/lib/chain";
import { EVE_AGENT_WALLET, FOLIO_DISTRIBUTOR, keeperPlan, usycAddress } from "@/lib/keeper";
import { shortAddr } from "@/lib/format";
import { LAUNCH, pctOfFee } from "@/lib/fees";

type Status = {
  ok?: boolean;
  keeper?: string;
  treasury?: string | null;
  usyc?: string;
  reason?: string;
  balances?: {
    keeperUsdc: string;
    keeperUsyc: string;
    treasuryUsdc: string;
    treasuryUsyc: string;
  };
};

export function KeeperView() {
  const plan = keeperPlan();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/keeper/status")
      .then((r) => r.json())
      .then((j) => {
        if (live) setStatus(j);
      })
      .catch(() => {
        if (live) setStatus({ ok: false });
      });
    return () => {
      live = false;
    };
  }, []);

  const keeper = status?.keeper ?? EVE_AGENT_WALLET;
  const usyc = status?.usyc ?? usycAddress();
  const bal = status?.balances;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">Circle agent wallet</p>
      <h1 className="display-md mt-3">The keeper.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        {pctOfFee(LAUNCH.split.creatorBps)} of the trading fee is USDC to this Circle agent wallet. A buy waits until that USDC reaches 150. Most of it buys the book. 5% stays in USYC and BUIDL. The stocks are sent to people who hold $SFOLIO, in the same proportion. Another app can send USDC too. 5% of that stays. The rest buys the book for their holders.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
        <Metric
          label="Agent wallet"
          value={shortAddr(keeper)}
          hint="Creator rewards on Arc"
          href={`${ARC_EXPLORER}/address/${keeper}`}
        />
        <Metric
          label="USDC on keeper"
          value={bal ? `${Number(bal.keeperUsdc).toLocaleString()} USDC` : "—"}
          hint="Waiting to buy the book"
        />
        <Metric
          label="Cash sleeve"
          value={bal ? `${Number(bal.keeperUsyc).toLocaleString()} USYC` : "—"}
          hint="USYC and BUIDL. Not spent on stocks."
        />
      </div>

      <section className="mt-12">
        <p className="kicker">Plan</p>
        <h2 className="font-display mt-2 text-2xl italic tracking-tight">Buy the book.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{plan.reason}</p>
        <p className="mt-2 text-xs text-muted">
          <span className="font-mono text-fg uppercase">{plan.action}</span>
          {" · "}cash sleeve {plan.cashSleeveBps / 100}%{" · "}listed {plan.listedWeight}%
          {plan.queuedWeight > 0 ? ` · queued ${plan.queuedWeight}%` : ""}
        </p>
      </section>

      <section className="mt-12">
        <p className="kicker">On-chain</p>
        <ul className="mt-4 divide-y divide-border">
          <AllowRow label="Keeper" addr={keeper} />
          <AllowRow label="USDC" addr={ARC_USDC_ERC20} />
          <AllowRow label="USYC" addr={usyc} />
          <AllowRow label="Sends stocks" addr={FOLIO_DISTRIBUTOR} />
          {status?.treasury ? <AllowRow label="Treasury" addr={status.treasury} /> : null}
        </ul>
      </section>

      <p className="mt-10 text-sm text-muted">
        Fee split and the holder path are on{" "}
        <Link href="/docs" className="text-fg underline-offset-2 hover:underline">
          Docs
        </Link>
        . Names and weights are on{" "}
        <Link href="/bundles" className="text-fg underline-offset-2 hover:underline">
          Bundles
        </Link>
        .
      </p>
    </div>
  );
}

function Metric({ label, value, hint, href }: { label: string; value: string; hint: string; href?: string }) {
  const inner = (
    <>
      <p className="kicker">{label}</p>
      <p className="mt-3 font-display text-2xl tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="bg-surface px-5 py-6 sm:px-6 hover:bg-elevated">
      {inner}
    </a>
  ) : (
    <div className="bg-surface px-5 py-6 sm:px-6">{inner}</div>
  );
}

function AllowRow({ label, addr }: { label: string; addr: string }) {
  return (
    <li className="flex items-center gap-4 py-3">
      <span className="w-28 shrink-0 text-sm text-muted">{label}</span>
      <a className="min-w-0 truncate font-mono text-xs text-fg hover:underline" href={`${ARC_EXPLORER}/address/${addr}`} target="_blank" rel="noreferrer">
        {addr}
      </a>
    </li>
  );
}
