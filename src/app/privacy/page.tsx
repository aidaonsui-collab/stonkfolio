import type { Metadata } from "next";
import { Bullets, LegalPage } from "@/components/legal-page";
import { LEGAL_ADDRESS, LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what {LEGAL_NAME} (“Stonkfolio”, “we”) collects when you use the Stonkfolio website and
          how it is used. We do not ask you to create an account.
        </p>
      }
      sections={[
        {
          title: "Data we handle",
          body: (
            <Bullets
              items={[
                "Wallet addresses and on-chain data. Blockchains are public. When you connect a wallet or transact, your address and activity are visible on-chain and we read them to show balances and distributions.",
                "Signed choices. If you sign a stock choice for rewards, we store your wallet address, the choice, your signature and the time on our server so the keeper can apply it.",
                "Basic analytics. We use Vercel Web Analytics to count page views and similar usage. It is designed to work without cookies and without tracking you across sites.",
                "Server logs. Our hosting provider and servers log technical data such as IP address, user agent, requested URL and time, for security and operations.",
                "Support correspondence. If you email us, we keep your message and address to respond.",
                "Payment and identity data for on-ramps are collected by the on-ramp provider, not by us.",
              ]}
            />
          ),
        },
        {
          title: "Cookies and local storage",
          body: (
            <Bullets
              items={[
                "The Stonkfolio site does not set its own cookies.",
                "It stores a few items in your browser’s local storage: a flag for Preview mode, sample positions you create in Preview mode, a cached copy of your signed stock choice for your wallet address, and connection state saved by the wallet library. These stay on your device and you can clear them in your browser settings.",
                "Third-party services we embed or call (for example an on-ramp widget or your wallet) may use their own cookies or storage under their own policies.",
              ]}
            />
          ),
        },
        {
          title: "How we use data",
          body: (
            <p>
              To run and secure the Service, show your balances and distributions, apply your signed choices, detect
              abuse, comply with law, and answer support requests. We do not sell your personal data.
            </p>
          ),
        },
        {
          title: "Third-party processors",
          body: (
            <Bullets
              items={[
                "Vercel: hosting, logs and Web Analytics.",
                "Circle: keeper wallet, Earn and Borrow Kit, and the Circle on-ramp used for Add USDC. Requests to Circle APIs are routed through our servers.",
                "Transak and other on-ramp partners, if and when enabled: they handle payment, identity and compliance checks under their own privacy policies.",
                "xStocks (Backed / Payward): planned issuer of the tokenized equities. Its public catalog is read on request. If you interact with their services you are subject to their policies.",
                "Public RPC and block explorer providers that you or the site call to read the blockchain.",
              ]}
            />
          ),
        },
        {
          title: "Retention",
          body: (
            <p>
              Server logs are kept by our hosting provider for its standard period. Signed choices are kept while
              they are needed to run the Service. Support emails are kept as long as needed to handle your request and
              for our records. On-chain data cannot be deleted by us.
            </p>
          ),
        },
        {
          title: "Your rights",
          body: (
            <p>
              Depending on where you live, you may have rights to access, correct, delete or restrict use of your
              personal data, or to object to processing. Contact us to make a request. We cannot alter or erase data on
              a public blockchain.
            </p>
          ),
        },
        {
          title: "Children",
          body: <p>The Service is not for anyone under 18, and we do not knowingly collect data from children.</p>,
        },
        {
          title: "Changes",
          body: <p>We may update this policy. The date at the top shows the latest version.</p>,
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
