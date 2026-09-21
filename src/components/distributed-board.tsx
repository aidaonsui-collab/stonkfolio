import { usd } from "@/lib/format";
import { cumulativeDistributed, SLEEVE_TONE } from "@/lib/stocks";
import { StockMark } from "./stock-mark";

export function DistributedBoard() {
  const { totalUsd, rows } = cumulativeDistributed();
  const peak = rows[0]?.usd || 1;

  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <p className="kicker">Distributed</p>
      <p className="num mt-3 font-display text-4xl tracking-tight">{usd(totalUsd)}</p>
      <p className="mt-2 max-w-md text-sm text-muted">Cumulative mark value sent to holders.</p>
      <ul className="mt-6">
        {rows.map(({ stock, usd: value }) => (
          <li key={stock.ticker} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border py-2.5 last:border-0">
            <span className="flex w-28 items-center gap-2 sm:w-36">
              <StockMark stock={stock} size={28} />
              <span className="font-mono text-sm">{stock.ticker}</span>
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <span
                className="block h-full"
                style={{ width: `${(value / peak) * 100}%`, background: SLEEVE_TONE[stock.kind] }}
              />
            </span>
            <span className="num text-sm">{usd(value)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="kicker">Total</span>
        <span className="num text-sm">{usd(totalUsd)}</span>
      </div>
    </section>
  );
}
