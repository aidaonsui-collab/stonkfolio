"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ConnectButton } from "./connect-button";
import { FolioMark } from "./folio-mark";
import { useFolio } from "@/lib/folio";
import { EVE_LAUNCH } from "@/lib/chain";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/distributions", label: "Distributions" },
  { href: "/yield", label: "Yield" },
  { href: "/basket", label: "Basket" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader({ tone = "folio" }: { tone?: "folio" | "farm" }) {
  const path = usePathname();
  const { preview, setPreview } = useFolio();
  const [open, setOpen] = useState(false);
  const farm = tone === "farm";

  const nav = (
    <nav className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold tracking-[0.14em] uppercase",
              farm
                ? active
                  ? "text-[#c8f542]"
                  : "text-[#9aa392] hover:text-[#eef6e6]"
                : active
                  ? "text-[#111]"
                  : "text-[#8a8a8a] hover:text-[#111]",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  if (farm) {
    return (
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-[#eef6e6]">
          <FolioMark className="size-6" />
          <span className="text-[13px] font-semibold tracking-[0.16em] uppercase">Stonkfolio</span>
        </Link>
        <div className="hidden md:block">{nav}</div>
        <div className="flex items-center gap-2">
          <PreviewChip farm preview={preview} onClick={() => setPreview(!preview)} />
          <ConnectButton tone="farm" />
          <button
            type="button"
            className="rounded-lg p-2 text-[#eef6e6] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? (
          <div className="absolute inset-x-3 top-16 rounded-2xl border border-[rgba(200,245,66,0.12)] bg-[#101410] p-3 md:hidden">
            {nav}
            <button
              type="button"
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold tracking-[0.14em] text-[#c8f542] uppercase"
              onClick={() => {
                setPreview(!preview);
                setOpen(false);
              }}
            >
              {preview ? "Preview on" : "Preview"}
            </button>
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <header className="relative z-20 mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6">
      <div className="folio-shadow flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 sm:px-4">
        <Link href="/" className="flex items-center gap-2.5 pr-1 text-[#111]">
          <FolioMark className="size-6" />
          <span className="hidden text-[13px] font-semibold tracking-[0.18em] uppercase sm:inline">
            Stonkfolio
          </span>
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">{nav}</div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={EVE_LAUNCH}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl px-3 py-2 text-[12px] font-semibold tracking-[0.12em] text-[#6b6b6b] uppercase hover:text-[#111] sm:inline"
          >
            Launch
          </a>
          <PreviewChip preview={preview} onClick={() => setPreview(!preview)} />
          <ConnectButton tone="folio" />
          <button
            type="button"
            className="rounded-xl bg-[#f3f0e8] p-2.5 text-[#111] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="folio-shadow mt-2 rounded-2xl bg-white p-3 md:hidden">
          {nav}
          <button
            type="button"
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold tracking-[0.14em] text-[#111] uppercase"
            onClick={() => {
              setPreview(!preview);
              setOpen(false);
            }}
          >
            {preview ? "Preview on" : "Preview"}
          </button>
        </div>
      ) : null}
    </header>
  );
}

function PreviewChip({
  preview,
  onClick,
  farm,
}: {
  preview: boolean;
  onClick: () => void;
  farm?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hidden h-11 items-center rounded-xl px-3 text-[11px] font-semibold tracking-[0.12em] uppercase sm:inline-flex",
        farm
          ? preview
            ? "bg-[#c8f542]/15 text-[#c8f542]"
            : "text-[#9aa392] hover:text-[#eef6e6]"
          : preview
            ? "bg-[#111] text-white"
            : "text-[#8a8a8a] hover:text-[#111]",
      )}
    >
      {preview ? "Preview on" : "Preview"}
    </button>
  );
}
