import { STOCKS } from "@/lib/stocks";
import { usd } from "@/lib/format";

export function TickerTape() {
  const row = [...STOCKS, ...STOCKS];
  return (
    <div className="overflow-hidden border-y border-border bg-surface">
      <div className="tape-track flex w-max gap-8 px-4 py-3">
        {row.map((s, i) => (
          <span key={`${s.ticker}-${i}`} className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-mono text-xs font-medium tracking-wide text-fg">{s.ticker}</span>
            <span className="num text-xs text-muted">{usd(s.price)}</span>
            <span className="num text-xs text-accent">{s.weight}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
