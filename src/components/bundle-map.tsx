import { STOCK_LOGO } from "@/lib/brand-marks";
import { SLEEVE_TONE, STOCKS, type Stock } from "@/lib/stocks";
import { cn } from "@/lib/utils";
import { LogoTile } from "./stock-mark";

function fillFor(stock: Stock) {
  const t = Math.max(0.28, Math.min(0.92, stock.weight / 16));
  const mix = Math.round(t * 100);
  return `color-mix(in oklab, ${SLEEVE_TONE[stock.kind]} ${mix}%, var(--color-elevated))`;
}

function Strip({ stock, flex }: { stock: Stock; flex?: boolean }) {
  const ink = stock.weight >= 8;
  return (
    <div
      className={cn(
        "relative flex min-h-14 min-w-0 flex-col justify-between overflow-hidden rounded-md p-2.5",
        !flex && "h-16",
      )}
      style={{
        flex: flex ? Math.max(stock.weight, 3.5) : undefined,
        background: fillFor(stock),
      }}
    >
      <p className={cn("flex min-w-0 items-center gap-1.5 font-mono text-xs font-semibold tracking-wide", ink ? "text-ink" : "text-fg")}>
        {STOCK_LOGO[stock.ticker] ? (
          <LogoTile src={STOCK_LOGO[stock.ticker]} label={stock.name} size={22} />
        ) : null}
        <span className="truncate">{stock.ticker}</span>
      </p>
      <p className={cn("num text-xs", ink ? "text-ink/70" : "text-fg/80")}>{stock.weight}%</p>
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
