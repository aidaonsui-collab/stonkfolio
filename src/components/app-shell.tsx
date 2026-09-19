"use client";

import Link from "next/link";
import { EVE_FUN } from "@/lib/chain";
import { NetworkBanner } from "./network-banner";
import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-bg text-fg">
      <NetworkBanner />
      <SiteHeader />
      <main className="min-w-0 flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Pad:{" "}
            <a className="text-fg underline-offset-2 hover:underline" href={EVE_FUN} target="_blank" rel="noreferrer">
              eve.fun
            </a>
            . Settlement: Arc 5042. Gas: USDC.
          </p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/bundles" className="hover:text-fg">
              Bundles
            </Link>
            <Link href="/portfolio" className="hover:text-fg">
              Portfolio
            </Link>
            <Link href="/yield" className="hover:text-fg">
              Yield
            </Link>
            <Link href="/keeper" className="hover:text-fg">
              Keeper
            </Link>
            <Link href="/docs" className="hover:text-fg">
              Docs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
