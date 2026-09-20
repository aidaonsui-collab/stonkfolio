"use client";

import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "./connect-button";
import { ARC_CHAIN_ID, ARC_USDC_ERC20 } from "@/lib/chain";
import { depositToVault, withdrawFromVault, getVaultPosition, type VaultPosition } from "@/lib/earn-client";
import { pct, qty } from "@/lib/format";
import type { EarnVaultRow } from "@/lib/earn";

export function EarnFarmSheet({
  vault,
  onClose,
}: {
  vault: EarnVaultRow | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={Boolean(vault)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent className="border-border bg-surface text-fg data-[side=right]:sm:max-w-[420px] sm:max-w-[420px]">
        {vault ? <EarnFarmSheetBody key={vault.vaultAddress} vault={vault} /> : null}
      </SheetContent>
    </Sheet>
  );
}

/** Keyed by vault address in the parent, so a fresh vault remounts (and resets) this instead of an effect-driven reset. */
function EarnFarmSheetBody({ vault }: { vault: EarnVaultRow }) {
  const { address, isConnected, chainId, connector } = useAccount();
  const onArc = isConnected && chainId === ARC_CHAIN_ID;
  const { data: usdcRaw, refetch: refetchBalance } = useReadContract({
    address: ARC_USDC_ERC20,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address && onArc) },
  });

  const [mode, setMode] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [position, setPosition] = useState<VaultPosition | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!connector || !onArc) return;
    let live = true;
    getVaultPosition(connector, vault.vaultAddress).then((p) => {
      if (live) setPosition(p);
    });
    return () => {
      live = false;
    };
  }, [vault.vaultAddress, connector, onArc]);

  const have = usdcRaw !== undefined ? Number(formatUnits(usdcRaw, 6)) : 0;
  const staked = position?.balance ?? 0;
  const max = mode === "in" ? have : staked;
  const n = Number(amount);

  async function submit() {
    if (!connector) return;
    if (!(n > 0)) {
      setMsg("Enter an amount.");
      setStatus("error");
      return;
    }
    if (n > max + 1e-9) {
      setMsg(mode === "in" ? `Only ${qty(have, 4)} USDC in your wallet.` : `Only ${qty(staked, 4)} supplied here.`);
      setStatus("error");
      return;
    }
    setStatus("pending");
    setMsg("Confirm in your wallet…");
    setTxUrl(null);
    try {
      const res =
        mode === "in"
          ? await depositToVault(connector, vault.vaultAddress, amount)
          : await withdrawFromVault(connector, vault.vaultAddress, amount);
      setStatus("success");
      setMsg(mode === "in" ? "Supplied." : "Withdrawn.");
      setTxUrl(res.explorerUrl);
      setAmount("");
      refetchBalance();
      setPosition(await getVaultPosition(connector, vault.vaultAddress));
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Transaction failed.");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-fg">
          {vault.name}
          <span className="mt-0.5 block text-xs font-normal tracking-normal text-muted">
            {vault.protocol} · Circle Earn Kit
          </span>
        </SheetTitle>
        <SheetDescription className="text-muted">
          {vault.circleGuarded ? "Circle-guarded. " : ""}
          {pct(vault.apy * 100, 2)} current APY on {vault.asset}.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 px-5 pb-8">
        {!isConnected || !onArc ? (
          <div className="flex flex-col items-start gap-3 rounded-md bg-elevated p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">Connect a wallet on Arc to supply or withdraw.</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
                <p className="kicker">Wallet</p>
                <p className="mt-1 font-medium">{qty(have, 4)} USDC</p>
              </div>
              <div className="rounded-md bg-elevated p-3 shadow-[var(--shadow-border)]">
                <p className="kicker">Supplied</p>
                <p className="mt-1 font-medium">{staked > 0 ? `${qty(staked, 4)} ${vault.asset}` : "—"}</p>
              </div>
            </div>

            <div className="flex rounded-md bg-elevated p-1">
              {(["in", "out"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setMsg(null);
                    setStatus("idle");
                  }}
                  className={`h-10 flex-1 rounded-sm text-xs font-medium tracking-wide uppercase ${
                    mode === m ? "bg-accent text-accent-fg" : "text-muted"
                  }`}
                >
                  {m === "in" ? "Supply" : "Withdraw"}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="kicker">Amount · USDC</span>
              <div className="mt-2 flex gap-2">
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setMsg(null);
                    setStatus("idle");
                  }}
                  placeholder="0.00"
                  className="num h-11 border-border bg-bg text-fg"
                />
                <Button variant="outline" type="button" onClick={() => setAmount(String(max))}>
                  Max
                </Button>
              </div>
            </label>

            <Button variant="accent" onClick={submit} disabled={status === "pending"}>
              {status === "pending" ? "Confirming…" : mode === "in" ? "Supply USDC" : "Withdraw"}
            </Button>
            {msg ? (
              <p className={`text-xs ${status === "error" ? "text-down" : "text-accent"}`}>
                {msg}
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="ml-1 underline">
                    View tx
                  </a>
                ) : null}
              </p>
            ) : null}
          </>
        )}
        <p className="text-xs leading-relaxed text-muted">
          Deposits go straight from your wallet into the Morpho vault through Circle Earn Kit — the keeper never touches this.
        </p>
      </div>
    </>
  );
}
