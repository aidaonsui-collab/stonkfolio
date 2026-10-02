"use client";

import { useRef, useState } from "react";
import { TOKEN } from "@/lib/chain";
import {
  folioBalanceLabel,
  folioCardSearch,
  holderLabel,
  recordedAssets,
  parseFolioCard,
  shareText,
  type FolioCard,
} from "@/lib/folio-card";
import { useFolio } from "@/lib/folio";
import { qty, usd } from "@/lib/format";
import { ARC_ARCH_PATH, ARC_ARCH_VIEWBOX } from "@/lib/arc-emblem";
import { FolioMark } from "./logo";
import { Button } from "./ui/button";
import { markFor, StockMark } from "./stock-mark";

export function FolioShareCard() {
  const { seeing, preview, address, stonk, earned } = useFolio();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const assets = recordedAssets(earned);
  const card: FolioCard = seeing
    ? parseFolioCard(
        new URLSearchParams(
          folioCardSearch({
            stonk,
            sample: preview,
            holder: holderLabel(address, preview),
            assets,
          }),
        ),
      )
    : { rewardsUsd: 0, stonk: 0, sample: false, holder: "Holder", assets: [], hidden: 0 };

  function cardUrl() {
    return `/api/folio-card?${folioCardSearch({
      stonk,
      sample: preview,
      holder: holderLabel(address, preview),
      assets,
    })}`;
  }

  async function imageFile() {
    const res = await fetch(cardUrl());
    if (!res.ok) throw new Error("Could not make the card.");
    const blob = await res.blob();
    return new File([blob], "stonkfolio-folio.png", { type: "image/png" });
  }

  async function share() {
    if (!seeing || busy.current) return;
    const url = cardUrl();
    if (!canShareImageFiles()) {
      downloadUrl(url);
      setNote("Image saved. Attach it to your post.");
      return;
    }
    busy.current = true;
    setPending(true);
    setNote("");
    try {
      const file = await imageFile();
      await navigator.share({ files: [file], text: shareText(card), title: "Stonkfolio" });
      setNote("Share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      downloadUrl(url);
      setNote("Image saved. Attach it to your post.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function postOnX() {
    if (!seeing || busy.current) return;
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText(card)}\nhttps://www.stonkfolio.me/portfolio`)}`;
    const opened = window.open(href, "_blank");
    if (opened) opened.opener = null;
    downloadUrl(cardUrl());
    setNote(opened ? "Image saved. Attach it to the X post." : "Image saved. Allow pop-ups to open X, then attach the image.");
  }

  return (
    <section className="relative mt-10 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <svg
        viewBox={ARC_ARCH_VIEWBOX}
        aria-hidden
        className="pointer-events-none absolute -left-16 top-2 h-72 w-auto text-fg opacity-[0.12] sm:-left-10 sm:h-[22rem]"
      >
        <path fill="currentColor" d={ARC_ARCH_PATH} />
      </svg>
      <div className="relative flex flex-col gap-8 p-5 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <FolioMark className="size-9 opacity-60" />
            <p className="kicker text-accent">Share card</p>
          </div>
          <h2 className="font-display mt-3 text-3xl italic tracking-tight">Rewards received</h2>
          <p className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">
            {seeing ? usd(card.rewardsUsd) : "—"}
          </p>
          <p className="mt-3 text-sm text-muted">
            {seeing ? `${folioBalanceLabel(card.stonk)} · ${card.holder}` : `Connect to fill this card with your $${TOKEN.symbol}.`}
          </p>
          {card.sample ? <p className="mt-2 text-sm text-accent">Sample folio</p> : null}
        </div>
        <div className="w-full lg:max-w-sm">
          <p className="kicker">Assets held</p>
          {seeing && card.assets.length ? (
            <ul className="mt-3 divide-y divide-border">
              {card.assets.map((asset) => (
                <li key={asset.ticker} className="flex items-center gap-3 py-2.5">
                  <StockMark stock={markFor(asset.ticker)} size={28} />
                  <span className="min-w-0 flex-1 font-medium">{asset.ticker}</span>
                  <span className="num text-sm text-muted">{qty(asset.amount, 4)}</span>
                  <span className="num text-sm">{usd(asset.valueUsd)}</span>
                </li>
              ))}
              {card.hidden > 0 ? <li className="py-2.5 text-sm text-muted">+{card.hidden} more</li> : null}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">{seeing ? "No stocks yet." : "Assets show up here after you connect."}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-8">
        <Button onClick={() => void share()} disabled={!seeing || pending}>
          {pending ? "Making card…" : "Share"}
        </Button>
        <Button variant="outline" onClick={postOnX} disabled={!seeing || pending}>
          Post on X
        </Button>
        <p className="text-sm text-muted" role="status">
          {note}
        </p>
      </div>
    </section>
  );
}

function canShareImageFiles() {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([new Uint8Array([0])], "stonkfolio-folio.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

function downloadUrl(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "stonkfolio-folio.png";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => link.remove(), 1500);
}
