import type { Metadata } from "next";
import { Bullets, LegalPage } from "@/components/legal-page";
import { LEGAL_ADDRESS, LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Risk Disclosure" };

export default function Page() {
  return (
    <LegalPage
      kicker="Legal"
      title="Risk Disclosure"
      intro={
        <p>
          Crypto assets, tokenized securities and yield mechanisms carry significant risk. You can lose some or all of
          what you put in. Do not use money you cannot afford to lose.
        </p>
      }
      sections={[
        {
          title: "Total loss",
          body: (
            <p>
              Values can fall to zero. Nothing is guaranteed, including the stocks the keeper buys, yield rates, or the
              value or liquidity of $SFOLIO.
            </p>
          ),
        },
        {
          title: "Smart-contract risk",
          body: (
            <p>
              The Stonkfolio contracts, the launch pad and pool contracts, and the protocols we connect to (such as
              Morpho, Circle Earn, Circle Borrow Kit and Uniswap) may have bugs or be exploited. Audit reports are not
              yet published. Even audited code can fail. Transactions are generally irreversible.
            </p>
          ),
        },
        {
          title: "Liquidity and price risk",
          body: (
            <p>
              Markets for $SFOLIO and tokenized stocks may be thin. You may not be able to sell, or may sell at a large
              discount. Prices, slippage and fees can change quickly. Borrowing can lead to liquidation and loss of
              collateral.
            </p>
          ),
        },
        {
          title: "Oracle, issuer and custodian risk",
          body: (
            <Bullets
              items={[
                "Tokenized equities are planned as xStocks (Backed / Payward), a third-party issuer, and are not yet available on Arc. Their value depends on the issuer, its custodians and brokers holding the underlying shares, and on the issuer’s ability to mint and redeem. An issuer failure, freeze or legal action could cause loss.",
                "USYC and other cash-like tokens depend on their issuers and on eligibility rules that may restrict who can hold or redeem them.",
                "Price feeds and oracles can be wrong, delayed or manipulated.",
              ]}
            />
          ),
        },
        {
          title: "Stablecoin risk",
          body: (
            <p>
              USDC, EURC and other stablecoins can lose their peg, be frozen by their issuer, or become hard to redeem.
              Gas on Arc is paid in USDC.
            </p>
          ),
        },
        {
          title: "Network risk",
          body: (
            <p>
              Arc is a new network. It may suffer outages, congestion, reorganizations, upgrades, validator or bridge
              failures, or be unavailable. Public RPC endpoints may be limited or prune history.
            </p>
          ),
        },
        {
          title: "Regulatory risk",
          body: (
            <Bullets
              items={[
                "Laws on crypto assets and tokenized securities are changing. Regulators may restrict or prohibit features, or require us to block access.",
                "Tokenized stocks may not be available to all users or jurisdictions. Some may be unavailable to persons in the United States.",
                "You are responsible for knowing whether use is lawful where you are, and for your own taxes.",
              ]}
            />
          ),
        },
        {
          title: "Availability of tokenized stocks",
          body: (
            <p>
              The tokenized stocks in the book are planned as xStocks. xStocks have been announced for Arc but are not yet
              deployed there, so they are not tradeable on Arc today. The keeper does not buy them until they are live
              and have a real market. Features that depend on them may not work, and
              may change or never launch.
            </p>
          ),
        },
        {
          title: "Not advice, not insured",
          body: (
            <Bullets
              items={[
                "Nothing here is investment, legal or tax advice.",
                "Past performance, sample data and illustrations do not predict future results.",
                "Crypto assets and tokenized stocks are not deposits and are not insured by the FDIC or SIPC. You have no protection if you lose them.",
              ]}
            />
          ),
        },
        {
          title: "Contact",
          body: (
            <p>
              {LEGAL_NAME}, {LEGAL_ADDRESS}.{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-fg underline-offset-2 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          ),
        },
      ]}
    />
  );
}
