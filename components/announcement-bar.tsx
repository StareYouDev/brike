import { site } from "@/data/catalog";

function MarqueeGroup({
  items,
  ariaHidden,
}: {
  items: string[];
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-10 pr-10"
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((text) => (
        <span
          key={text}
          className="flex items-center gap-10 whitespace-nowrap text-[12.5px] font-medium tracking-[0.14em] text-cream uppercase"
        >
          {text}
          <span className="text-peach" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className="marquee overflow-hidden bg-navy py-2.5"
      role="region"
      aria-label="Store announcements"
    >
      <div className="marquee-track" style={{ ["--marquee-duration" as string]: "45s" }}>
        <MarqueeGroup items={items} />
        <MarqueeGroup items={items} ariaHidden />
      </div>
      <span className="sr-only">
        {site.name} announcements: {items.join(". ")}
      </span>
    </div>
  );
}
