import type { Stock } from "@/lib/stocks";
import { stockByTicker } from "@/lib/stocks";
import { cn } from "@/lib/utils";

const FALLBACK: Record<string, Pick<Stock, "ticker" | "letter" | "name">> = {
  USDC: { ticker: "USDC", letter: "$", name: "USD Coin" },
};

export function markFor(ticker: string) {
  return (
    stockByTicker[ticker] ??
    FALLBACK[ticker] ?? {
      ticker,
      letter: ticker.slice(0, 2),
      name: ticker,
    }
  );
}

export function StockMark({
  stock,
  size = 36,
  className,
}: {
  stock: Pick<Stock, "ticker" | "letter" | "name">;
  size?: number;
  className?: string;
}) {
  const letter = stock.letter || stock.ticker.slice(0, 1);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm bg-ink font-mono font-medium text-paper",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size < 32 ? 9 : letter.length > 1 ? 10 : 13,
      }}
      aria-label={stock.name}
    >
      {letter}
    </span>
  );
}
