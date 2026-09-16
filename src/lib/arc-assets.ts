/**
 * Arc mainnet (5042) RWA / cash-sleeve contracts.
 * Source: https://docs.arc.io/arc/references/contract-addresses
 * BUIDL: named live by @arc Sep 16; address not published in Arc docs yet.
 */

export const ARC_USYC = {
  token: "0x8a5D989Bbb96929F689B0200f435f53dA42bF490" as const,
  entitlements: "0xb69ecb156Dc0028198028c501340d5367845ca72" as const,
  teller: "0x51A8CE47dC08ba5CD19c7aa84EA6fD6664f60f9b" as const,
  decimals: 6,
  /** USYC is allowlisted / eligibility-gated (institutional, non-US, $100k min per Circle docs). */
  permissioned: true,
  source: "https://docs.arc.io/arc/references/contract-addresses",
} as const;

export const ARC_BUIDL = {
  token: null as `0x${string}` | null,
  decimals: 6,
  permissioned: true,
  source: "https://x.com/arc/status/2100170562504990880",
  note: "Arc named BUIDL live for eligible users; fill token when Securitize/BlackRock publish the Arc address.",
} as const;
