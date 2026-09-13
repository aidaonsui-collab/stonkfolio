"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ARC_CHAIN_ID } from "@/lib/chain";
import { shortAddr } from "@/lib/format";
import { addOrSwitchArc } from "@/lib/wagmi";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
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

  return (
    <div ref={wrap} className="relative">
      {onArc && address ? (
        <Button variant="outline" size="sm" type="button" onClick={() => setOpen((v) => !v)}>
          {shortAddr(address)}
        </Button>
      ) : (
        <Button variant="default" size="sm" type="button" onClick={go} disabled={isPending}>
          {isPending ? "…" : isConnected ? "Switch to Arc" : "Connect"}
        </Button>
      )}
      {open && onArc && address ? (
        <div className="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-md bg-surface p-1 text-sm shadow-[var(--shadow-border)]">
          <button
            type="button"
            className="block w-full rounded-sm px-3 py-2 text-left hover:bg-elevated"
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
        <p className="absolute right-0 z-50 mt-2 w-64 rounded-md bg-surface p-3 text-xs text-muted shadow-[var(--shadow-border)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
