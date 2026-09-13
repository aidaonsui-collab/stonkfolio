"use client";

import { useEffect, useState } from "react";

type Payload = {
  ok: boolean;
  configured: boolean;
  environment: string;
  testData?: boolean;
  count?: number;
  stocks?: { symbol: string; tradable: boolean }[];
  missing?: string[];
  reason?: string;
};

export function DinariStatus() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dinari/stocks")
      .then((r) => r.json())
      .then((json: Payload) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, configured: false, environment: "sandbox", reason: "Could not reach /api/dinari/stocks" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const env = data?.environment ?? "sandbox";
  const label = !data
    ? "Checking Dinari…"
    : !data.configured
      ? "Dinari keys not set"
      : data.ok
        ? `Dinari ${env}${data.testData ? " · test data" : ""} · ${data.count ?? 0} basket names`
        : `Dinari ${env} error`;

  return (
    <div className="panel-tight mt-6 px-4 py-3 text-sm">
      <p className="kicker">Issuer feed</p>
      <p className="mt-2 font-medium">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Keys go in <code className="font-mono text-fg">.env.local</code> as{" "}
        <code className="font-mono text-fg">DINARI_API_KEY_ID</code> and{" "}
        <code className="font-mono text-fg">DINARI_API_SECRET_KEY</code>. Sandbox is test data only — production needs KYB at partners.dinari.com. Never put the secret in the browser or git.
      </p>
      {data?.ok && data.stocks?.length ? (
        <p className="mt-2 font-mono text-xs text-muted">
          Live in sandbox: {data.stocks.map((s) => s.symbol).join(" · ")}
          {data.missing?.length ? ` · missing ${data.missing.join(", ")}` : ""}
        </p>
      ) : null}
      {data?.reason ? <p className="mt-2 text-xs text-down">{data.reason}</p> : null}
    </div>
  );
}
