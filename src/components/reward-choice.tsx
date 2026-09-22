"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { BOOK_CHOICE, choiceMessage, choiceStocks } from "@/lib/reward-choice";
import { MIN_BUY_USDC } from "@/lib/keeper";
import { cn } from "@/lib/utils";
import { addOrSwitchArc } from "@/lib/wagmi";
import { Button } from "./ui/button";
import { ConnectButton } from "./connect-button";
import { StockMark } from "./stock-mark";

type Saved = { choice: string; signedAt: string | null };

function storageKey(address: string) {
  return `stonkfolio-choice:${address.toLowerCase()}`;
}

export function RewardChoice() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const names = choiceStocks();
  const [draft, setDraft] = useState(BOOK_CHOICE);
  const [saved, setSaved] = useState<Saved>({ choice: BOOK_CHOICE, signedAt: null });
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");
  const onArc = isConnected && chainId === ARC_CHAIN_ID;

  useEffect(() => {
    if (!address) {
      setDraft(BOOK_CHOICE);
      setSaved({ choice: BOOK_CHOICE, signedAt: null });
      setNote("");
      return;
    }
    let local: Saved | null = null;
    try {
      const raw = localStorage.getItem(storageKey(address));
      local = raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      local = null;
    }
    if (local?.choice) {
      setDraft(local.choice);
      setSaved(local);
    }
    let live = true;
    fetch(`/api/reward-choice?address=${address}`)
      .then((r) => r.json())
      .then((j: { signed?: boolean; choice?: string; signedAt?: string | null }) => {
        if (!live || !j.signed || !j.choice) return;
        const remote = { choice: j.choice, signedAt: j.signedAt ?? null };
        if (!local?.signedAt || (remote.signedAt && remote.signedAt > local.signedAt)) {
          setDraft(remote.choice);
          setSaved(remote);
          localStorage.setItem(storageKey(address), JSON.stringify(remote));
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [address]);

  async function sign() {
    if (!address) return;
    setNote("");
    setPending(true);
    try {
      if (chainId !== ARC_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: ARC_CHAIN_ID });
        } catch {
          await addOrSwitchArc();
        }
      }
      const signedAt = new Date().toISOString();
      const message = choiceMessage(address, draft, signedAt);
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/reward-choice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, choice: draft, signature, signedAt }),
      });
      const j = (await res.json()) as { ok?: boolean; message?: string; choice?: string; signedAt?: string };
      if (!res.ok || !j.ok || !j.choice) {
        setNote(j.message || "Could not save this choice.");
        return;
      }
      const next = { choice: j.choice, signedAt: j.signedAt ?? signedAt };
      localStorage.setItem(storageKey(address), JSON.stringify(next));
      setSaved(next);
      setDraft(next.choice);
      setNote(next.choice === BOOK_CHOICE ? "Signed. You stay on the book." : `Signed. Next cycle you take ${next.choice}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setNote(msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signature cancelled." : "Could not sign.");
    } finally {
      setPending(false);
    }
  }

  const signedLabel = saved.signedAt ? (saved.choice === BOOK_CHOICE ? "On the book" : saved.choice) : "Not signed";
  const dirty = !saved.signedAt || draft !== saved.choice;

  return (
    <section className="panel mt-10 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl italic tracking-tight">Next cycle.</h2>
        <p className="kicker">{signedLabel}</p>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Sign one name, or stay on the book. It applies to the next cycle. A buy waits until fee USDC reaches {MIN_BUY_USDC}.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Pick
          selected={draft === BOOK_CHOICE}
          onClick={() => setDraft(BOOK_CHOICE)}
          label="The book"
        />
        {names.map((s) => (
          <Pick key={s.ticker} selected={draft === s.ticker} onClick={() => setDraft(s.ticker)} label={s.ticker}>
            <StockMark stock={s} size={22} />
          </Pick>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!isConnected ? (
          <ConnectButton />
        ) : !onArc ? (
          <Button type="button" onClick={() => void sign()} disabled={pending}>
            Switch to Arc
          </Button>
        ) : (
          <Button type="button" onClick={() => void sign()} disabled={pending || !dirty}>
            {pending ? "Waiting for signature" : dirty ? "Sign this choice" : "Signed"}
          </Button>
        )}
        <p className="text-sm text-muted">{note || (isConnected ? "USYC and BUIDL stay in the book." : "Connect a wallet on Arc to sign.")}</p>
      </div>
    </section>
  );
}

function Pick({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
        selected ? "bg-accent text-accent-fg" : "bg-elevated text-fg hover:opacity-90",
      )}
    >
      {children}
      {label}
    </button>
  );
}
