import type { ReactNode } from "react";
import { SLEEVE_TONE } from "@/lib/stocks";

export function PageHero({
  kicker,
  title,
  children,
  action,
}: {
  kicker?: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        {kicker ? <p className="kicker text-accent">{kicker}</p> : null}
        <h1 className="display-md mt-3 text-fg">{title}</h1>
        {children ? <div className="mt-4 text-sm leading-relaxed text-muted">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

const TONE_BY_KEY: Record<string, string> = {
  creator: "var(--color-accent)",
  burn: "var(--color-down)",
  autoLp: "var(--color-up)",
  platform: "var(--color-cash)",
  equity: SLEEVE_TONE.equity,
  index: SLEEVE_TONE.index,
  mmf: SLEEVE_TONE.mmf,
};

export function WeightBar({
  parts,
}: {
  parts: { key: string; label: string; value: number }[];
}) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-elevated">
      {parts.map((p) => (
        <span
          key={p.key}
          className="h-full"
          style={{
            width: `${(p.value / total) * 100}%`,
            background: TONE_BY_KEY[p.key] ?? "var(--color-accent)",
          }}
          title={`${p.label} ${p.value}%`}
        />
      ))}
    </div>
  );
}
