"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { shortAddr } from "@/lib/format";
import { addOrSwitchArc } from "@/lib/wagmi";
import { cn } from "@/lib/utils";

export function ConnectButton({ tone = "folio" }: { tone?: "folio" | "farm" }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const onArc = isConnected && chainId === ARC_CHAIN_ID;
  const injected = connectors.filter((c) => c.id === "injected" || c.type === "injected");

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function go() {
    setHint("");
    const connector = injected[0] ?? connectors[0];
    if (!connector) {
      setHint("No injected wallet. Install MetaMask or Rabby.");
      setOpen(true);
      return;
    }
    try {
      if (!isConnected) await connect({ connector, chainId: ARC_CHAIN_ID });
      if (chainId !== ARC_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: ARC_CHAIN_ID });
        } catch {
          await addOrSwitchArc();
        }
      }
      setOpen(false);
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not connect");
      setOpen(true);
    }
  }

  const farm = tone === "farm";
  const btn = farm
    ? "h-10 rounded-xl bg-[#c8f542] px-4 text-sm font-semibold text-[#0b1208] hover:bg-[#d6ff6a]"
    : "h-11 rounded-xl bg-[#f3f0e8] px-5 text-[13px] font-semibold tracking-[0.14em] text-[#111] hover:bg-[#ebe7dc]";

  return (
    <div ref={wrap} className="relative">
      {onArc && address ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className={cn(btn, "uppercase")}>
          {shortAddr(address)}
        </button>
      ) : (
        <button type="button" onClick={go} disabled={isPending} className={cn(btn, "uppercase")}>
          {isPending ? "…" : isConnected ? "Switch to Arc" : "Connect"}
        </button>
      )}
      {open && onArc && address ? (
        <div className="absolute right-0 z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-card p-1 text-sm shadow-lg">
          <button
            type="button"
            className="block w-full rounded-lg px-3 py-2 text-left hover:bg-muted"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
          >
            Disconnect
          </button>
        </div>
      ) : null}
      {hint ? (
        <p className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
