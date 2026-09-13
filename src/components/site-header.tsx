"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { EVE_LAUNCH } from "@/lib/chain";
import { useFolio } from "@/lib/folio";
import { cn } from "@/lib/utils";
import { FolioMark, Wordmark } from "./logo";
import { Button } from "./ui/button";
import { ConnectButton } from "./connect-button";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/bundles", label: "Bundles" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/yield", label: "Yield" },
  { href: "/docs", label: "Docs" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { preview, setPreview } = useFolio();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-0">
      {LINKS.map((l) => {
        const active =
          l.href === "/"
            ? pathname === "/"
            : pathname.startsWith(l.href) ||
              (l.href === "/portfolio" && pathname.startsWith("/distributions")) ||
              (l.href === "/bundles" && pathname.startsWith("/basket"));
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-sm px-3 py-2 text-xs font-medium tracking-wide uppercase",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 pr-2">
          <FolioMark className="size-8" />
          <Wordmark className="hidden sm:flex" />
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">{nav}</div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={EVE_LAUNCH}
            target="_blank"
            rel="noreferrer"
            className="hidden h-11 items-center px-3 text-xs font-medium tracking-wide text-muted uppercase hover:text-fg sm:inline-flex"
          >
            Launch
          </a>
          <Button
            variant={preview ? "accent" : "ghost"}
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Tape on" : "Preview"}
          </Button>
          <ConnectButton />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          {nav}
          <button
            type="button"
            className="mt-2 w-full rounded-sm px-3 py-2 text-left text-xs font-medium tracking-wide text-fg uppercase"
            onClick={() => {
              setPreview(!preview);
              setOpen(false);
            }}
          >
            {preview ? "Tape on" : "Preview tape"}
          </button>
        </div>
      ) : null}
    </header>
  );
}
