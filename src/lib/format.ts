export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function usd(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function compactUsd(n: number) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return usd(n, abs >= 100 ? 0 : 2);
}

export function compactQty(n: number, suffix = "") {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  let body: string;
  if (abs >= 1_000_000_000) body = `${(abs / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) body = `${(abs / 1_000_000).toFixed(1)}M`;
  else if (abs >= 10_000) body = `${(abs / 1_000).toFixed(1)}K`;
  else body = abs >= 100 ? abs.toFixed(0) : abs >= 1 ? abs.toFixed(2) : abs.toFixed(4);
  return suffix ? `${body} ${suffix}` : body;
}

export function pct(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function qty(n: number, digits = 4) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  return n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function dash(connected: boolean, value: string) {
  return connected ? value : "—";
}

export function daysToMainnet(at: Date) {
  const ms = at.getTime() - Date.now();
  if (ms <= 0) return "Arc public mainnet is open.";
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? "1 day to Arc public mainnet." : `${d} days to Arc public mainnet.`;
}
