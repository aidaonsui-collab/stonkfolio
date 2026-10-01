/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Company logo in a round, light tile so dark marks read on the dark theme.
 * If the image fails to load, `fallback` (the ticker circle) is shown instead.
 */
export function StockLogo({
  src,
  label,
  size = 32,
  className,
  fallback,
}: {
  src: string;
  label: string;
  size?: number;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  const inner = Math.round(size * 0.62);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={label}
        width={inner}
        height={inner}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="object-contain"
        style={{ width: inner, height: inner }}
      />
    </span>
  );
}
