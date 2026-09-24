"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AnnouncementBar } from "@/components/announcement-bar";
import { MobileMenu } from "@/components/mobile-menu";
import { mainNavigation, type Collection, type Product } from "@/data/catalog";
import { cartCount, useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { productImages } from "@/lib/images";

export interface SiteHeaderData {
  announcements: string[];
  searchProducts: Product[];
  searchCollections: Pick<Collection, "slug" | "title">[];
}

function SearchPanel({
  products,
  collections,
  onNavigate,
}: {
  products: Product[];
  collections: Pick<Collection, "slug" | "title">[];
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.fabric.toLowerCase().includes(q) ||
            p.style.toLowerCase().includes(q) ||
            p.collections.some((slug) => slug.includes(q)),
        )
        .slice(0, 6)
    : [];
  const matchedCollections = q
    ? collections.filter((c) => c.title.toLowerCase().includes(q)).slice(0, 3)
    : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <label htmlFor="site-search" className="sr-only">
        Search the shop
      </label>
      <input
        id="site-search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search pyjamas, prints, fabrics…"
        className="w-full border-b-2 border-ink bg-transparent pb-3 font-heading text-h4 outline-none placeholder:text-muted-foreground"
      />
      {q ? (
        <div className="mt-5 max-h-[50vh] overflow-y-auto">
          {matchedCollections.length > 0 ? (
            <ul className="mb-4 flex flex-wrap gap-2">
              {matchedCollections.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    onClick={onNavigate}
                    className="inline-block rounded-full bg-meta px-4 py-1.5 text-[13px] font-medium hover:bg-peach"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {results.length > 0 ? (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={onNavigate}
                    className="flex items-center gap-4 py-3 transition-opacity hover:opacity-70"
                  >
                    <Image
                      src={productImages(p).a}
                      alt=""
                      width={48}
                      height={60}
                      unoptimized
                      className="shrink-0 rounded-sm object-cover"
                    />
                    <span className="flex-1 text-[15px]">{p.name}</span>
                    <span className="text-[14px] text-muted-foreground">
                      £{p.price.toFixed(2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-[15px] text-muted-foreground">
              No matches for “{query}”. Try “cotton”, “festive” or “kids”.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {["Celestial", "Brushed Cotton", "Matching", "Nightdress"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="rounded-full border border-border px-4 py-1.5 text-[13px] hover:border-ink"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SiteHeader({ data }: { data: SiteHeaderData }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = cartCount(items);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hoverOpen = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  const activeItem = mainNavigation.find((m) => m.label === openMenu);

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar items={data.announcements} />
      <div
        className={cn(
          "border-b border-border bg-white/97 backdrop-blur transition-shadow",
          scrolled && "shadow-[0_1px_15px_rgba(0,0,0,0.08)]",
        )}
        onMouseLeave={hoverClose}
      >
        {/* top row: logo + icons */}
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="-ml-2 rounded-full p-2.5 transition-colors hover:bg-meta"
                >
                  <Menu size={22} strokeWidth={1.6} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[86vw] max-w-sm gap-0 overflow-y-auto p-0"
              >
                <SheetHeader className="border-b border-border px-5 pt-5 pr-14 pb-4">
                  <SheetTitle className="font-logo text-[26px] leading-none">
                    BRIKE
                  </SheetTitle>
                  <p className="text-[10.5px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                    Menu
                  </p>
                </SheetHeader>
                <MobileMenu
                  count={count}
                  onNavigate={() => setMobileOpen(false)}
                  onSearch={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  onCart={() => {
                    setMobileOpen(false);
                    openCart();
                  }}
                />
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="font-logo text-[26px] leading-none lg:text-[34px]">
            BRIKE
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-full p-2 transition-colors hover:bg-meta"
            >
              {searchOpen ? <X size={19} strokeWidth={1.6} /> : <Search size={19} strokeWidth={1.6} />}
            </button>
            <button
              type="button"
              aria-label={`Basket, ${count} items`}
              onClick={openCart}
              className="relative rounded-full p-2 transition-colors hover:bg-meta"
            >
              <ShoppingBag size={19} strokeWidth={1.6} />
              {count > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-peach-deep px-1 text-[10.5px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* desktop nav */}
        <nav aria-label="Main" className="hidden justify-center gap-8 px-6 pb-3 lg:flex">
          {mainNavigation.map((item) => (
            <div
              key={item.label}
              onMouseEnter={() => (item.columns.length ? hoverOpen(item.label) : hoverOpen(""))}
              className="relative"
            >
              <Link
                href={item.href}
                onFocus={() => (item.columns.length ? hoverOpen(item.label) : null)}
                className="relative inline-block py-1 text-[15.5px] font-medium transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:after:scale-x-100"
                aria-haspopup={item.columns.length ? "true" : undefined}
                aria-expanded={item.columns.length ? openMenu === item.label : undefined}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* mega menu */}
        {activeItem && activeItem.columns.length > 0 ? (
          <div
            className="absolute inset-x-0 top-full hidden border-t border-border bg-white shadow-[0_18px_30px_-18px_rgba(0,0,0,0.25)] lg:block"
            onMouseEnter={() => hoverOpen(activeItem.label)}
          >
            <div
              className="mx-auto grid max-w-[1200px] gap-10 px-6 py-9"
              style={{
                gridTemplateColumns: `repeat(${activeItem.columns.length + 1}, minmax(0, 1fr))`,
              }}
            >
              {activeItem.columns.map((col) => (
                <div key={col.heading}>
                  <p className="mb-3 text-[11.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {col.heading}
                  </p>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          onClick={() => setOpenMenu(null)}
                          className="text-[15px] transition-colors hover:text-peach-deep"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="border-l border-border pl-8">
                <Link
                  href={`/collections/${activeItem.href.split("/").pop()}`}
                  onClick={() => setOpenMenu(null)}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-meta">
                    <Image
                      src={`/prints/collection-${activeItem.href.split("/").pop()}.svg`}
                      alt={activeItem.label}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 font-heading text-h5">{activeItem.label}</p>
                  <p className="text-[13.5px] text-peach-deep">Shop the collection →</p>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* search panel */}
        {searchOpen ? (
          <div className="border-t border-border bg-white py-7">
            <SearchPanel
              products={data.searchProducts}
              collections={data.searchCollections}
              onNavigate={() => setSearchOpen(false)}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
