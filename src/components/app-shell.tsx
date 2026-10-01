"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, BookOpen, Briefcase, FileText, Home, Landmark, Sprout } from "lucide-react";
import { SiteHeader, LINKS, isActive } from "./site-header";
import { FolioMark, Wordmark } from "./logo";
import { cn } from "@/lib/utils";
import { LEGAL_NAME } from "@/lib/site";

const ICONS = {
  "/": Home,
  "/bundles": BookOpen,
  "/portfolio": Briefcase,
  "/swap": ArrowLeftRight,
  "/yield": Sprout,
  "/keeper": Landmark,
  "/docs": FileText,
} as const;

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/risk", label: "Risk Disclosure" },
  { href: "/about", label: "About" },
] as const;

const DOCK = LINKS.filter((l) => l.href !== "/docs");

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col self-start border-r border-border bg-surface/80 px-3 py-5 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <FolioMark className="size-8" />
          <Wordmark />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            const Icon = ICONS[l.href];
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  active ? "bg-accent text-accent-fg" : "text-muted hover:bg-elevated hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <SiteHeader />
        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        <footer className="border-t border-border pb-20 lg:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-xs text-muted sm:px-6">
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-1">
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex min-h-11 items-center px-2 font-medium text-fg hover:text-accent first:pl-0"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <p>© {new Date().getFullYear()} {LEGAL_NAME}</p>
          </div>
        </footer>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          <ul className="grid grid-cols-6">
            {DOCK.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center gap-1 py-2 text-[11px] tracking-wide",
                      active ? "text-accent" : "text-muted",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
