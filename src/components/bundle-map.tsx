import { STOCKS, type Stock } from "@/lib/stocks";
import { cn } from "@/lib/utils";

function fillFor(weight: number) {
  const t = Math.max(0, Math.min(1, (weight - 2) / 14));
  const mint = Math.round(14 + t * 70);
  return `color-mix(in oklab, var(--color-accent) ${mint}%, var(--color-elevated))`;
}

function Strip({ stock, flex }: { stock: Stock; flex?: boolean }) {
  const minty = stock.weight >= 8;
  return (
    <div
      className={cn(
        "relative flex min-h-14 min-w-0 flex-col justify-between overflow-hidden rounded-md p-2.5",
        !flex && "h-16",
      )}
      style={{
        flex: flex ? Math.max(stock.weight, 3.5) : undefined,
        background: fillFor(stock.weight),
      }}
    >
      <p className={cn("truncate font-mono text-xs font-semibold tracking-wide", minty ? "text-ink" : "text-ink/80")}>
        {stock.ticker}
      </p>
      <p className={cn("num text-[11px]", minty ? "text-ink/70" : "text-ink/55")}>{stock.weight}%</p>
    </div>
  );
}

export function BundleMap({
  stocks = STOCKS,
  className,
  height = 320,
}: {
  stocks?: Stock[];
  className?: string;
  height?: number;
}) {
  const rows = [stocks.slice(0, 4), stocks.slice(4, 8), stocks.slice(8)];

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-1 sm:hidden">
        {stocks.map((s) => (
          <Strip key={s.ticker} stock={s} />
        ))}
      </div>
      <div className="hidden flex-col gap-1 sm:flex" style={{ minHeight: height }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex min-h-0 flex-1 gap-1"
            style={{ flex: i === 0 ? 1.15 : i === 1 ? 1 : 0.85 }}
          >
            {row.map((s) => (
              <Strip key={s.ticker} stock={s} flex />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
