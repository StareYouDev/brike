"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, ShoppingBag, Truck } from "lucide-react";
import { mainNavigation } from "@/data/catalog";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  count: number;
  onNavigate: () => void;
  onSearch: () => void;
  onCart: () => void;
};

const sectionId = (label: string) =>
  `mobile-section-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * Slide-out navigation for small screens. Top-level items with submenus get an
 * accordion toggle (chevron) separate from the label link, so tapping the label
 * still navigates straight to the collection. All touch targets are >= 44px.
 */
export function MobileMenu({ count, onNavigate, onSearch, onCart }: MobileMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* quick actions */}
      <div className="flex gap-2 px-5 pt-4 pb-4">
        <button
          type="button"
          onClick={onSearch}
          className="flex flex-1 items-center justify-center gap-2 border border-ink/15 bg-meta py-3 text-[11.5px] font-semibold tracking-[0.16em] uppercase transition-colors hover:border-ink hover:bg-cream"
        >
          <Search size={15} strokeWidth={1.8} aria-hidden />
          Search
        </button>
        <button
          type="button"
          onClick={onCart}
          className="relative flex flex-1 items-center justify-center gap-2 border border-ink/15 bg-meta py-3 text-[11.5px] font-semibold tracking-[0.16em] uppercase transition-colors hover:border-ink hover:bg-cream"
        >
          <ShoppingBag size={15} strokeWidth={1.8} aria-hidden />
          Basket
          {count > 0 ? (
            <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-peach-deep px-1 text-[10.5px] font-bold text-white">
              {count}
            </span>
          ) : null}
        </button>
      </div>

      <nav aria-label="Main" className="border-t border-border">
        {mainNavigation.map((item) => {
          const hasChildren = item.columns.length > 0;
          const open = openSection === item.label;
          return (
            <div key={item.label} className="border-b border-border">
              <div className="flex items-stretch">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-13 flex-1 items-center pr-2 pl-5 font-heading text-h5 transition-colors active:bg-meta",
                    open && "text-peach-deep",
                  )}
                >
                  {item.label}
                </Link>
                {hasChildren ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={sectionId(item.label)}
                    aria-label={`${open ? "Hide" : "Show"} ${item.label} links`}
                    onClick={() => setOpenSection(open ? null : item.label)}
                    className="flex w-13 shrink-0 items-center justify-center transition-colors hover:text-peach-deep"
                  >
                    <ChevronDown
                      size={18}
                      strokeWidth={1.7}
                      aria-hidden
                      className={cn(
                        "transition-transform duration-300",
                        open ? "rotate-180 text-peach-deep" : "text-foreground/55",
                      )}
                    />
                  </button>
                ) : (
                  <span
                    aria-hidden
                    className="flex w-12 shrink-0 items-center justify-center text-peach-deep/70"
                  >
                    <ChevronRight size={16} strokeWidth={1.8} />
                  </span>
                )}
              </div>

              {hasChildren && open ? (
                <div
                  id={sectionId(item.label)}
                  className="animate-in fade-in-0 slide-in-from-top-2 pt-1 pb-4 duration-200"
                >
                  {item.columns.map((col) => (
                    <div key={col.heading} className="mb-4 last:mb-0">
                      <p className="mb-1 ml-6 text-[11px] font-semibold tracking-[0.18em] text-peach-deep uppercase">
                        {col.heading}
                      </p>
                      <ul className="ml-6 border-l border-peach/70">
                        {col.links.map((l) => (
                          <li key={l.label}>
                            <Link
                              href={l.href}
                              onClick={onNavigate}
                              className="flex min-h-11 items-center px-4 text-[15px] text-foreground/85 transition-colors hover:text-peach-deep active:bg-meta"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* pinned footer */}
      <div className="mt-auto bg-cream px-5 pt-3 pb-5">
        <ul>
          <li>
            <Link
              href="/contact"
              onClick={onNavigate}
              className="flex min-h-11 items-center justify-between text-[14.5px] font-medium transition-colors hover:text-peach-deep"
            >
              Contact us
              <ChevronRight size={15} strokeWidth={1.8} aria-hidden className="text-peach-deep" />
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              onClick={onNavigate}
              className="flex min-h-11 items-center justify-between text-[14.5px] font-medium transition-colors hover:text-peach-deep"
            >
              Delivery &amp; Returns
              <ChevronRight size={15} strokeWidth={1.8} aria-hidden className="text-peach-deep" />
            </Link>
          </li>
        </ul>
        <p className="flex items-center gap-2 border-t border-ink/10 pt-3 text-[13px] text-ink/70">
          <Truck size={15} strokeWidth={1.7} aria-hidden className="shrink-0" />
          Free UK delivery over £60
        </p>
      </div>
    </div>
  );
}
