import type { Stock } from "@/lib/stocks";
import { stockByTicker } from "@/lib/stocks";

const FALLBACK: Record<string, Pick<Stock, "ticker" | "color" | "letter" | "name">> = {
  USDC: { ticker: "USDC", color: "#2775ca", letter: "$", name: "USD Coin" },
};

export function markFor(ticker: string) {
  return (
    stockByTicker[ticker] ??
    FALLBACK[ticker] ?? {
      ticker,
      color: "#1b2318",
      letter: ticker.slice(0, 2),
      name: ticker,
    }
  );
}

export function StockMark({
  stock,
  size = 36,
}: {
  stock: Pick<Stock, "ticker" | "color" | "letter" | "name">;
  size?: number;
}) {
  const letter = stock.letter || stock.ticker.slice(0, 1);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: stock.color,
        fontSize: size < 32 ? 10 : letter.length > 1 ? 11 : 15,
      }}
      aria-label={stock.name}
    >
      {stock.ticker === "AAPL" ? (
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="white" aria-hidden>
          <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 0.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1.1-1.5 1.5-2.9 1.5-3-.1 0-2.8-1.1-2.8-4.1zM14.6 6.4c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.6 2.7-1.4z" />
        </svg>
      ) : (
        letter
      )}
    </span>
  );
}
