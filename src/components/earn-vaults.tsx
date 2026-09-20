"use client";

import { useEffect, useState } from "react";
import { pct } from "@/lib/format";
import { EarnFarmSheet } from "./earn-farm-sheet";

type EarnVaultRow = {
  name: string;
  protocol: string;
  asset: string;
  vaultAddress: string;
  apy: number;
  status: string;
  circleGuarded: boolean;
  totalDeposits: string;
  liquidity: string;
};

type Payload = { ok: boolean; chain: string; vaults: EarnVaultRow[]; reason?: string };

export function EarnVaults() {
  const [data, setData] = useState<Payload | null>(null);
  const [open, setOpen] = useState<EarnVaultRow | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/earn/vaults")
      .then((r) => r.json())
      .then((j) => {
        if (live) setData(j);
      })
      .catch(() => {
        if (live) setData({ ok: false, chain: "Arc", vaults: [], reason: "Earn Kit request failed" });
      });
    return () => {
      live = false;
    };
  }, []);

  const vaults = data?.vaults ?? [];
  const active = vaults.filter((v) => v.status === "active");

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Circle Earn Kit · Morpho on Arc</p>
          <h2 className="display-md mt-2">USDC vaults.</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Live from Earn Kit. Deposit USDC here — not the stock book. The keeper parks idle creator USDC in USYC; this board is for holders who want Morpho USDC yield in-app.
          </p>
        </div>
        <a
          href="https://portal.arc.io/"
          target="_blank"
          rel="noreferrer"
          className="h-11 rounded-md px-4 text-sm text-muted shadow-[var(--shadow-border)] hover:text-fg inline-flex items-center"
        >
          Open Arc Portal
        </a>
      </div>

      {!data ? <p className="mt-6 text-sm text-muted">Loading Earn Kit vaults…</p> : null}
      {data && !data.ok ? <p className="mt-6 text-sm text-down">{data.reason}</p> : null}

      {vaults.length > 0 ? (
        <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.14em] text-muted uppercase">
                <th className="pb-3 font-medium">Vault</th>
                <th className="pb-3 font-medium">Protocol</th>
                <th className="pb-3 font-medium">APY</th>
                <th className="pb-3 font-medium">Deposits</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vaults.map((v) => (
                <tr
                  key={v.vaultAddress}
                  className={v.status === "active" ? "cursor-pointer border-b border-border last:border-0 hover:bg-elevated/60" : "border-b border-border last:border-0"}
                  onClick={() => {
                    if (v.status === "active") setOpen(v);
                  }}
                >
                  <td className="py-3.5">
                    <span className="block font-medium">{v.name}</span>
                    <span className="block font-mono text-xs text-muted">{v.asset}</span>
                  </td>
                  <td className="py-3.5 text-muted">{v.protocol}</td>
                  <td className="num py-3.5 font-medium text-accent">{pct(v.apy * 100, 2)}</td>
                  <td className="num py-3.5 text-muted">{Number(v.totalDeposits).toLocaleString()}</td>
                  <td className="py-3.5 text-right text-xs text-muted">
                    {v.circleGuarded ? "Guarded · " : null}
                    {v.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ul className="mt-6 flex flex-col divide-y divide-border md:hidden">
        {vaults.map((v) => (
          <li key={v.vaultAddress}>
            <button
              type="button"
              disabled={v.status !== "active"}
              onClick={() => setOpen(v)}
              className="flex w-full items-center gap-3 py-3.5 text-left disabled:opacity-70"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{v.name}</span>
                <span className="block text-xs text-muted">{v.protocol}</span>
              </span>
              <span className="num text-sm font-medium text-accent">{pct(v.apy * 100, 2)}</span>
            </button>
          </li>
        ))}
      </ul>
      {data?.ok ? (
        <p className="mt-3 text-xs text-muted">
          {active.length} active of {vaults.length} on {data.chain}. Only deposit active vaults.
        </p>
      ) : null}
      <EarnFarmSheet vault={open} onClose={() => setOpen(null)} />
    </section>
  );
}
