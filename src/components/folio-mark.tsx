export function FolioMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="2" width="13" height="13" rx="2.5" fill="currentColor" />
      <rect x="17" y="2" width="13" height="13" rx="2.5" fill="currentColor" opacity="0.55" />
      <rect x="2" y="17" width="13" height="13" rx="2.5" fill="currentColor" opacity="0.55" />
      <rect x="17" y="17" width="13" height="13" rx="2.5" fill="currentColor" opacity="0.28" />
    </svg>
  );
}
