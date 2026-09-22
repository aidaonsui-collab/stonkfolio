"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFolio } from "@/lib/folio";
import { cn } from "@/lib/utils";
import { FolioMark, Wordmark } from "./logo";
import { Button } from "./ui/button";
import { ConnectButton } from "./connect-button";

export const LINKS = [
  { href: "/", label: "Home" },
  { href: "/bundles", label: "Book" },
  { href: "/portfolio", label: "Folio" },
  { href: "/yield", label: "Yield" },
  { href: "/keeper", label: "Keeper" },
  { href: "/docs", label: "Docs" },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/portfolio") return pathname.startsWith("/portfolio") || pathname.startsWith("/distributions");
  if (href === "/bundles") return pathname.startsWith("/bundles") || pathname.startsWith("/basket");
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { preview, setPreview } = useFolio();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <FolioMark className="size-8" />
          <Wordmark />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 font-mono text-xs tracking-wide text-up sm:inline-flex">
            <span className="size-1.5 rounded-full bg-up" />
            Arc live
          </span>
          <Button
            variant={preview ? "accent" : "outline"}
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Tape on" : "Preview"}
          </Button>
          <ConnectButton />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-[#07111f]/70"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 flex h-dvh w-72 max-w-[85vw] flex-col border-l border-border bg-[#0d1a2e] px-4 py-5 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-medium">Menu</span>
                  <Button variant="ghost" size="icon-sm" aria-label="Close menu" onClick={() => setOpen(false)}>
                    <X className="size-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-1">
                  {LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-3 text-sm font-medium tracking-wide uppercase",
                        isActive(pathname, l.href) ? "bg-accent/15 text-accent" : "text-muted hover:text-fg",
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <button
                  type="button"
                  className="mt-4 rounded-md px-3 py-3 text-left text-sm font-medium tracking-wide text-fg uppercase"
                  onClick={() => {
                    setPreview(!preview);
                    setOpen(false);
                  }}
                >
                  {preview ? "Tape on" : "Preview tape"}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
