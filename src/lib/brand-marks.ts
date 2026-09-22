/** Published brand marks. A name with no symbol that stays readable at this size is absent. */
export const STOCK_LOGO: Record<string, string> = {
  CRCL: "/logos/crcl.svg",
  NVDA: "/logos/nvda.svg",
  AAPL: "/logos/aapl.svg",
  MSFT: "/logos/msft.svg",
  GOOGL: "/logos/googl.svg",
  AMZN: "/logos/amzn.svg",
  META: "/logos/meta.svg",
  TSLA: "/logos/tsla.svg",
  AMD: "/logos/amd.svg",
  COIN: "/logos/coin.png",
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
