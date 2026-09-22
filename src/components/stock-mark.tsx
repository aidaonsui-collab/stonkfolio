import { STOCK_LOGO } from "@/lib/brand-marks";
import type { Stock } from "@/lib/stocks";
import { SLEEVE_TONE, stockByTicker } from "@/lib/stocks";
import { cn } from "@/lib/utils";

const FALLBACK: Record<string, Pick<Stock, "ticker" | "letter" | "name" | "kind">> = {
  USDC: { ticker: "USDC", letter: "$", name: "USD Coin", kind: "mmf" },
};

export function markFor(ticker: string) {
  return (
    stockByTicker[ticker] ??
    FALLBACK[ticker] ?? {
      ticker,
      letter: ticker.slice(0, 2),
      name: ticker,
      kind: "equity" as const,
    }
  );
}

export function LogoTile({
  src,
  label,
  size = 32,
  className,
}: {
  src: string;
  label: string;
  size?: number;
  className?: string;
}) {
  const inner = Math.round(size * 0.72);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#f4f6f8]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={label}
    >
      <img src={src} alt="" width={inner} height={inner} className="object-contain" />
    </span>
  );
}

export function StockMark({
  stock,
  size = 36,
  className,
}: {
  stock: Pick<Stock, "ticker" | "letter" | "name"> & { kind?: Stock["kind"] };
  size?: number;
  className?: string;
}) {
  const logo = STOCK_LOGO[stock.ticker];
  if (logo) return <LogoTile src={logo} label={stock.name} size={size} className={className} />;
  const letter = stock.letter || stock.ticker.slice(0, 1);
  const tone = SLEEVE_TONE[stock.kind ?? "equity"];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-mono font-medium text-fg",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size < 32 ? 9 : letter.length > 1 ? 10 : 13,
        background: `color-mix(in oklab, ${tone} 28%, var(--color-elevated))`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tone} 45%, transparent)`,
      }}
      aria-label={stock.name}
    >
      {letter}
    </span>
  );
}
