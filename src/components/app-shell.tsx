"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NetworkBanner } from "./network-banner";
import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const farm = path.startsWith("/yield");

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.surface = farm ? "farm" : "folio";
    html.classList.toggle("dark", farm);
    return () => {
      html.dataset.surface = "folio";
      html.classList.remove("dark");
    };
  }, [farm]);

  return (
    <div className={farm ? "farm-dots min-h-full" : "min-h-full"}>
      <NetworkBanner tone={farm ? "farm" : "folio"} />
      <SiteHeader tone={farm ? "farm" : "folio"} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
