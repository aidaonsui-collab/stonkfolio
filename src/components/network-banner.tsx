"use client";

export function NetworkBanner() {
  return (
    <div className="flex items-start gap-2 border-b border-border bg-elevated px-4 py-2.5 text-xs leading-snug text-muted sm:items-center sm:px-6">
      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent sm:mt-0" />
      <p className="min-w-0">
        <span className="mr-2 font-mono tracking-[0.14em] text-fg uppercase">Network</span>
        Arc mainnet. Creator 70% to the keeper. USYC sleeve, then the book.
      </p>
    </div>
  );
}
