import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Reveal } from "@/components/reveal";
import { POLICY_UPDATED, traderDetails } from "@/lib/legal";

/**
 * Shared chrome for the three policy pages (returns, privacy, terms) so they
 * read as one family: breadcrumb + display header + "who we are" block, then
 * consistently spaced sections. Server-only — children come straight from
 * the page's copy.
 */
export function LegalShell({
  title,
  eyebrow,
  intro,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb items={[{ label: title }]} />

      <header className="mt-8 max-w-3xl">
        <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-line" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="text-balance font-heading text-display-3">{title}</h1>
        <p className="mt-4 text-[16px] text-foreground/80">{intro}</p>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Last updated {POLICY_UPDATED}
        </p>
      </header>

      <div className="mt-12 max-w-3xl space-y-12">{children}</div>
    </div>
  );
}

/** One policy section: heading + consistent prose rhythm. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal>
      <section>
        <h2 className="font-heading text-h2">{title}</h2>
        <div className="mt-4 space-y-4 text-[15.5px] leading-relaxed text-foreground/75">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

/** Tight bullet list inside a LegalSection. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-peach-deep">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** The "who we are" details every policy opens with. */
export function TraderDetails() {
  return (
    <ul className="space-y-1.5">
      {traderDetails().map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
