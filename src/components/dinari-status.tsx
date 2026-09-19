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

  if (!data) {
    return (
      <div className="panel-tight mt-6 px-4 py-3 text-sm">
        <p className="kicker">Issuer feed</p>
        <p className="mt-2 text-muted">Checking the Dinari catalog…</p>
      </div>
    );
  }

  if (!data.configured || !data.ok) return null;

  const names = data.stocks ?? [];
  return (
    <div className="panel-tight mt-6 px-4 py-3 text-sm">
      <p className="kicker">Issuer feed</p>
      <p className="mt-2 font-medium">
        Dinari · {data.count ?? names.length} names in the book
        {data.testData ? " · preview catalog" : ""}
      </p>
      {names.length ? (
        <p className="mt-2 font-mono text-xs text-muted">{names.map((s) => s.symbol).join(" · ")}</p>
      ) : null}
    </div>
  );
}
