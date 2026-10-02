/** Circle's token icons, plus the WETH token-list mark. Marks belong to their owners and only identify the asset. */
export const TOKEN_LOGO: Record<string, string> = {
  USDC: "/logos/usdc.svg",
  EURC: "/logos/eurc.svg",
  cirBTC: "/logos/cirbtc.svg",
  WETH: "/logos/weth.png",
};

/**
 * Company marks served from /public/logos/stocks. SPY has none: the SPDR S&P 500 ETF mark is not ours to ship,
 * so it keeps the ticker circle. Marks belong to their owners and are used only to identify the company.
 */
export const STOCK_LOGO: Record<string, string> = {
  CRCL: "/logos/stocks/crcl.svg",
  NVDA: "/logos/stocks/nvda.svg",
  AAPL: "/logos/stocks/aapl.svg",
  MSFT: "/logos/stocks/msft.svg",
  GOOGL: "/logos/stocks/googl.svg",
  AMZN: "/logos/stocks/amzn.svg",
  META: "/logos/stocks/meta.svg",
  TSLA: "/logos/stocks/tsla.svg",
  AMD: "/logos/stocks/amd.svg",
  COIN: "/logos/stocks/coin.png",
  BE: "/logos/stocks/be.svg",
  MSTR: "/logos/stocks/mstr.svg",
  USYC: "/logos/usyc.svg",
};

const CURATORS: { test: RegExp; src: string }[] = [
  { test: /^bitwise\b/i, src: "/logos/bitwise.svg" },
  { test: /^gauntlet\b/i, src: "/logos/gauntlet.svg" },
  { test: /^dialectic\b/i, src: "/logos/dialectic.png" },
  { test: /^keyrock\b/i, src: "/logos/keyrock.svg" },
  { test: /^steakhouse\b/i, src: "/logos/steakhouse.svg" },
  { test: /^flowmark\b/i, src: "/logos/flowmark.svg" },
];

export function curatorLogo(vaultName: string) {
  return CURATORS.find((c) => c.test.test(vaultName))?.src ?? null;
}
