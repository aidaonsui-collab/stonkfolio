import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, LegalPage } from "@/components/legal-page";
import { LEGAL_ADDRESS, LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms of Service"
      intro={
        <p>
          These terms govern your use of the Stonkfolio website and related software (the “Service”), operated by{" "}
          {LEGAL_NAME}, {LEGAL_ADDRESS} (“Stonkfolio”, “we”, “us”). By using the Service you agree to them. If you do
          not agree, do not use the Service.
        </p>
      }
      sections={[
        {
          title: "What the Service is",
          body: (
            <>
              <p>
                Stonkfolio is software that shows a curated book of tokenized stocks and routes fee income to buy that
                book for holders of the $SFOLIO token, together with yield and borrowing interfaces that connect to
                third-party protocols on the Arc network. See <Link href="/docs" className="text-fg underline-offset-2 hover:underline">Docs</Link> and{" "}
                <Link href="/about" className="text-fg underline-offset-2 hover:underline">About</Link> for how it works.
              </p>
            </>
          ),
        },
        {
          title: "Non-custodial",
          body: (
            <Bullets
              items={[
                "Stonkfolio does not hold user assets in pooled custody. You connect your own wallet and you control your keys. We cannot recover lost keys or reverse transactions.",
                "Transactions you sign move assets directly between your wallet and the protocol or contract involved.",
                "The keeper is a documented automated process. It acts only under the rules published in the Docs and: it receives fee USDC, buys the book, and sends the resulting tokens to eligible holders. It does not take custody of your wallet.",
                "Fee income and purchased tokens pass through contracts and wallets listed on the About page before they are distributed.",
              ]}
            />
          ),
        },
        {
          title: "Service limitations",
          body: (
            <Bullets
              items={[
                "Features may be unavailable, delayed, limited or changed at any time. Some features, including tokenized stocks, are not live yet and depend on third parties.",
                "Prices, balances, rates and other figures shown may be sample, preview or delayed data and may be inaccurate.",
                "We may suspend or restrict access, in whole or in part, to comply with law or to protect the Service or its users.",
              ]}
            />
          ),
        },
        {
          title: "Your obligations",
          body: (
            <Bullets
              items={[
                "You are at least 18 and have legal capacity to enter into these terms.",
                "You will comply with all laws that apply to you, including sanctions and export controls. You are not on, owned by, or acting for anyone on any sanctions list, and you will not use the Service from a comprehensively sanctioned jurisdiction.",
                "You will not use the Service where it would be unlawful, or where the issuer of a tokenized asset or a protocol restricts access. Some tokenized securities may not be available to persons in the United States or other jurisdictions.",
                "You are solely responsible for your own taxes and for reporting any gains, income or distributions you receive.",
                "You will not attempt to disrupt, exploit or reverse engineer the Service, or use it for money laundering, fraud or any unlawful purpose.",
                "You are responsible for the security of your wallet, devices and keys.",
              ]}
            />
          ),
        },
        {
          title: "No investment advice",
          body: (
            <p>
              Nothing in the Service is investment, legal, tax or accounting advice, or an offer or solicitation to buy
              or sell any security, token or financial product. The stock book is a software configuration, not a
              recommendation. Do your own research and consult a qualified adviser.
            </p>
          ),
        },
        {
          title: "Third-party assets and services",
          body: (
            <Bullets
              items={[
                "Tokenized equities and indexes are planned to be issued by a third-party provider, xStocks (Backed / Payward), and are not yet available on Arc. They are subject to the issuer’s own terms, eligibility rules, minting, redemption and availability, which we do not control. They may be unavailable, or unavailable to you.",
                "USYC is issued by a third party and is subject to the issuer’s eligibility restrictions. Access may be limited to qualified or permitted holders.",
                "Yield, Earn and borrowing features use third-party protocols such as Circle Earn and Circle Borrow Kit on Morpho. Their terms apply, and their failures are outside our control.",
                "On-ramp and payment services are provided by third parties under their own terms and checks.",
              ]}
            />
          ),
        },
        {
          title: "Smart-contract and market risk",
          body: (
            <p>
              Smart contracts and blockchains can contain bugs, be exploited, or fail. Assets can lose value or be lost
              entirely. Read the <Link href="/risk" className="text-fg underline-offset-2 hover:underline">Risk Disclosure</Link> before using the Service.
            </p>
          ),
        },
        {
          title: "Disclaimer of warranties",
          body: (
            <p>
              The Service is provided “as is” and “as available”, without warranties of any kind, express or implied,
              including merchantability, fitness for a particular purpose, accuracy, availability, security and
              non-infringement, to the fullest extent permitted by law.
            </p>
          ),
        },
        {
          title: "Limitation of liability",
          body: (
            <p>
              To the fullest extent permitted by law, {LEGAL_NAME} and its members, managers, employees and contractors
              are not liable for any indirect, incidental, special, consequential or punitive damages, or for loss of
              profits, data, assets or goodwill, arising from your use of the Service, even if advised of the
              possibility. Our total liability for any claim is limited to the greater of the amount you paid us in the
              12 months before the claim and US$100. Some jurisdictions do not allow certain limits, so these may not
              apply to you in full.
            </p>
          ),
        },
        {
          title: "Changes to these terms",
          body: (
            <p>
              We may update these terms. The date at the top shows the latest version. Continued use after a change
              means you accept the new terms.
            </p>
          ),
        },
        {
          title: "Governing law",
          body: (
            <p>
              These terms are governed by the laws of the State of Texas, USA, without regard to conflict-of-law rules.
              Courts located in Texas have jurisdiction over disputes, unless applicable law requires otherwise.
            </p>
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
