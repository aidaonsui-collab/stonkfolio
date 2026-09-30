"use client";

import type { EIP1193Provider } from "viem";
import type { Connector } from "wagmi";
import { BorrowKit, BorrowServiceProvider, type BorrowQuote, type Loan, type MarketInfo } from "@circle-fin/borrow-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { BORROW_CHAIN, BORROW_LOAN_ASSETS, formatBorrowAmount } from "./borrow";

export type { BorrowQuote, Loan, MarketInfo };

let kit: BorrowKit | null = null;
/** Every call goes through /v1/borrowKit on this site, which adds the StonkFolio fee key server-side. */
function getKit() {
  if (!kit) kit = new BorrowKit({ providers: [new BorrowServiceProvider({ baseUrl: window.location.origin })] });
  return kit;
}

async function adapterFrom(connector: Connector) {
  const provider = (await connector.getProvider()) as EIP1193Provider;
  return createViemAdapterFromProvider({ provider });
}

const liquidityOf = (m: MarketInfo) => Number(m.liquidity?.amount ?? 0);

/** USDC and EURC loan markets on Arc, most free liquidity first. */
export async function listBorrowMarkets(): Promise<MarketInfo[]> {
  const out: MarketInfo[] = [];
  for await (const m of getKit().exploreMarketsIterator({ chain: BORROW_CHAIN })) {
    if ((BORROW_LOAN_ASSETS as readonly string[]).includes(m.loanAsset.symbol)) out.push(m);
  }
  return out.sort((a, b) => liquidityOf(b) - liquidityOf(a));
}

/** A priced preview: collateral taken, health, liquidation price, fees. Nothing is signed. */
export function quoteBorrow(marketId: string, walletAddress: string, amount: string) {
  return getKit().getBorrowQuote({ chain: BORROW_CHAIN, marketId, walletAddress, borrowAmount: formatBorrowAmount(amount) });
}

/** User-signed: the wallet posts collateral and receives the loan asset in one batch. */
export async function borrowFromMarket(connector: Connector, marketId: string, amount: string) {
  const adapter = await adapterFrom(connector);
  return getKit().borrow({ from: { adapter, chain: BORROW_CHAIN }, marketId, borrowAmount: formatBorrowAmount(amount) });
}

export async function listLoans(walletAddress: string): Promise<Loan[]> {
  const { loans } = await getKit().getLoans({ walletAddress, chain: BORROW_CHAIN });
  return loans.filter((l) => l.status !== "closed");
}

export function quoteCloseLoan(loanId: string) {
  return getKit().getCloseLoanQuote({ loanId, chain: BORROW_CHAIN });
}

/** Repays all debt and returns the collateral, user-signed. */
export async function closeLoan(connector: Connector, loanId: string) {
  const adapter = await adapterFrom(connector);
  return getKit().closeLoan({ from: { adapter, chain: BORROW_CHAIN }, loanId });
}
