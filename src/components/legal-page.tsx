import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/site";

export type LegalSection = { title: string; body: ReactNode };

/** Shared layout for Terms, Privacy, Risk and About. Matches the Docs page. */
export function LegalPage({
  kicker,
  title,
  intro,
  sections,
  showUpdated = true,
}: {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  sections: LegalSection[];
  showUpdated?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="kicker text-accent">{kicker}</p>
      <h1 className="display-md mt-3">{title}</h1>
      {showUpdated ? <p className="mt-3 font-mono text-xs text-muted">Last updated: {LEGAL_UPDATED}</p> : null}
      {intro ? <div className="mt-4 text-sm leading-relaxed text-muted">{intro}</div> : null}
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="font-display text-xl italic tracking-tight">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
