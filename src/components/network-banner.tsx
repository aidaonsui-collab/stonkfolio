"use client";

import { MAINNET_AT } from "@/lib/chain";
import { cn } from "@/lib/utils";

function daysLeft() {
  const ms = MAINNET_AT.getTime() - Date.now();
  if (ms <= 0) return "Arc public mainnet is open.";
  const d = Math.ceil(ms / 86_400_000);
  return d === 1 ? "1 day to Arc public mainnet." : `${d} days to Arc public mainnet.`;
}

export function NetworkBanner({ tone = "folio" }: { tone?: "folio" | "farm" }) {
  const farm = tone === "farm";
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-4 py-2.5 text-[12.5px] leading-snug sm:items-center sm:px-6",
        farm
          ? "border-b border-[rgba(200,245,66,0.08)] bg-[#0b0e0b] text-[#9aa392]"
          : "border-b border-black/5 bg-[#f6f4ee] text-[#5c5c5c]",
      )}
    >
      <span
        className={cn(
          "mt-1 size-1.5 shrink-0 rounded-full sm:mt-0",
          farm ? "bg-[#c8f542]" : "bg-[#3b82f6]",
        )}
      />
      <p className="min-w-0">
        <span className={cn("mr-2 font-semibold tracking-[0.12em] uppercase", farm ? "text-[#c8f542]" : "text-[#111]")}>
          Network conditions
        </span>
        {daysLeft()} Tokenized stocks list after that window. Creator USDC from eve.fun sits until the keeper can buy.
      </p>
    </div>
  );
}
