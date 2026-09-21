"use client";

import Link from "next/link";
import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-bg text-fg">
      <SiteHeader />
      <main className="min-w-0 flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Keeper wallet and Earn vaults use Circle on Arc.</p>
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
