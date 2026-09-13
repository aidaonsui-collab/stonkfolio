import { cn } from "@/lib/utils";

export function FolioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#111513" />
      <rect x="5.5" y="7" width="5" height="18" rx="1.2" fill="#F4F0E6" />
      <rect x="12.5" y="17.5" width="3.2" height="7.5" rx="0.9" fill="#F4F0E6" />
      <rect x="16.6" y="14" width="3.2" height="11" rx="0.9" fill="#F4F0E6" />
      <rect x="20.7" y="10.4" width="3.2" height="14.6" rx="0.9" fill="#5EE4A3" />
      <rect x="24.8" y="8" width="3.2" height="17" rx="0.9" fill="#F4F0E6" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-0 text-fg", className)}>
      <span className="text-sm font-semibold tracking-tight">Stonk</span>
      <span className="font-display text-[1.05rem] font-medium italic tracking-tight">Folio</span>
    </span>
  );
}
