import type { Metadata } from "next";
import Link from "next/link";
import { ARC_EXPLORER } from "@/lib/chain";
import { LAUNCH, pctOfFee } from "@/lib/fees";
import { Bullets, LegalPage } from "@/components/legal-page";
import { LEGAL_ADDRESS, LEGAL_NAME, SUPPORT_EMAIL, X_URL } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

const CONTRACTS = [
  {
    name: "Keeper wallet",
    address: "0x80aa1fA83F7B771BF2AB815DA9bA1236b1B91E3F",
    role: "Circle agent wallet on Arc. It is the keeper: it receives the rewards leg of fee USDC and runs the buy cycle.",
  },
  {
    name: "FolioTreasury",
    address: "0xd47B04A41b3734EAb2687ef01d07881D05F9215e",
    role: "Contract that holds bought tokens until they are distributed. Its keeper is the distributor.",
  },
  {
    name: "FolioDistributor",
    address: "0xf2815231F61A1A0cBA8BCDCBA41b22c26Ca4cB25",
    role: "Contract that pushes a merkle round of tokens to holders. It is the treasury’s keeper.",
  },
  {
    name: "Arcfun platform wallet",
    address: "0x26bD491560b5175ee8bD1DA4998Fe260FfC413c9",
    role: "Receives the creator cut (10% of launch-fee USDC that reaches the keeper) and the 0.25% Circle Borrow Kit origination fee.",
  },
  {
    name: "USYC",
    address: "0x8a5D989Bbb96929F689B0200f435f53dA42bF490",
    role: "Hashnote / Circle USYC token on Arc. Issuer eligibility restrictions apply.",
  },
] as const;

export default function Page() {
  return (
    <LegalPage
      kicker="About"
      title="About Stonkfolio"
      showUpdated
      sections={[
        {
          title: "What Stonkfolio is",
          body: (
            <>
              <p>
                Stonkfolio is an Arc-native stock folio. The idea: trades of the $SFOLIO token pay a {pctOfFee(LAUNCH.taxBps)} tax
                on buys and on sells, plus a {pctOfFee(LAUNCH.poolFeeBps)} pool fee. Argus keeps {pctOfFee(LAUNCH.split.platformBps)}.
                The keeper uses the rest to buy a curated book of tokenized stocks, and holders receive those stocks in
                proportion to the $SFOLIO they hold. See{" "}
                <Link href="/docs" className="text-fg underline-offset-2 hover:underline">Docs</Link> for the full flow.
              </p>
              <p>
                <strong className="text-fg">Status:</strong> $SFOLIO has not launched yet. The tokenized equities in the
                book are planned as xStocks (Backed / Payward). xStocks are not yet deployed on Arc, so they are not available
                or tradeable here, and no Arc contract addresses exist for them yet. The site shows sample data in Preview
                mode.
              </p>
            </>
          ),
        },
        {
          title: "Company and contact",
          body: (
            <ul className="space-y-1.5">
              <li>
                <span className="text-fg">Legal entity:</span> {LEGAL_NAME}
              </li>
              <li>
                <span className="text-fg">Address:</span> {LEGAL_ADDRESS}
              </li>
              <li>
                <span className="text-fg">Support email:</span>{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-fg underline-offset-2 hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <span className="text-fg">X:</span>{" "}
                <a href={X_URL} target="_blank" rel="noreferrer" className="text-fg underline-offset-2 hover:underline">
                  @StonkfolioArc
                </a>
              </li>
            </ul>
          ),
        },
        {
          title: "Contracts",
          body: (
            <>
              <p>These are the addresses on Arc (chain 5042) that the code uses today.</p>
              <ul className="divide-y divide-border">
                {CONTRACTS.map((c) => (
                  <li key={c.address} className="py-3">
                    <p className="font-medium text-fg">{c.name}</p>
                    <a
                      href={`${ARC_EXPLORER}/address/${c.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all font-mono text-xs text-accent hover:underline"
                    >
                      {c.address}
                    </a>
                    <p className="mt-1">{c.role}</p>
                  </li>
                ))}
              </ul>
              <Bullets
                items={[
                  `Argus keeps ${pctOfFee(LAUNCH.split.platformBps)} of the tax and of the pool fee. The other ${pctOfFee(LAUNCH.split.creatorBps)} is paid to the rewards wallet.`,
                  "Tokenized stock addresses: none yet. xStocks (Backed / Payward) will be listed here once the issuer publishes Arc deployments.",
                  "The $SFOLIO token address, LP lock details and audit reports will be published at launch.",
                ]}
              />
            </>
          ),
        },
        {
          title: "Legal",
          body: (
            <p>
              <Link href="/terms" className="text-fg underline-offset-2 hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="text-fg underline-offset-2 hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/risk" className="text-fg underline-offset-2 hover:underline">Risk Disclosure</Link>
            </p>
          ),
        },
      ]}
    />
  );
}
