"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  fabricFilters,
  styleFilters,
  type Product,
} from "@/data/catalog";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
};

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-[13px] transition-colors",
        active
          ? "border-ink bg-ink text-cream"
          : "border-input text-ink hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

export function CollectionView({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const [fabric, setFabric] = useState<string | null>(searchParams.get("fabric"));
  const [style, setStyle] = useState<string | null>(searchParams.get("style"));
  const [filter, setFilter] = useState<string | null>(searchParams.get("filter"));
  const [sort, setSort] = useState<SortKey>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // re-seed when the URL changes (mega-menu links arrive with
  // ?style= / ?fabric= / ?filter=) — synced during render, not in an effect
  const paramsKey = searchParams.toString();
  const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);
  if (prevParamsKey !== paramsKey) {
    setPrevParamsKey(paramsKey);
    setFabric(searchParams.get("fabric"));
    setStyle(searchParams.get("style"));
    setFilter(searchParams.get("filter"));
  }

  const availableFabrics = useMemo(
    () => fabricFilters.filter((f) => products.some((p) => p.fabric === f)),
    [products],
  );
  const availableStyles = useMemo(
    () => styleFilters.filter((s) => products.some((p) => p.style === s)),
    [products],
  );

  const visible = useMemo(() => {
    let list = products;
    if (filter) list = list.filter((p) => p.collections.includes(filter));
    if (fabric) list = list.filter((p) => p.fabric === fabric);
    if (style) list = list.filter((p) => p.style === style);
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [products, fabric, style, filter, sort]);

  const hasFilters = Boolean(fabric || style || filter);
  const clearAll = () => {
    setFabric(null);
    setStyle(null);
    setFilter(null);
  };

  return (
    <div>
      {/* toolbar */}
      <div className="sticky top-[132px] z-30 -mx-6 mb-8 border-b border-border bg-white/95 px-6 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 py-3.5">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-2 border border-input px-4 py-2 text-[13.5px] transition-colors hover:border-ink"
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasFilters ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-peach-deep text-[10px] font-bold text-white">
                !
              </span>
            ) : null}
          </button>

          <div className="ml-auto flex items-center gap-3">
            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 text-[13px] text-peach-deep underline underline-offset-2"
              >
                Clear all <X size={12} />
              </button>
            ) : null}
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border border-input bg-white px-3.5 py-2 text-[13.5px] outline-none transition-colors hover:border-ink"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {sortLabels[k]}
                </option>
              ))}
            </select>
            <span className="hidden text-[13.5px] text-muted-foreground sm:inline">
              {visible.length} {visible.length === 1 ? "style" : "styles"}
            </span>
          </div>
        </div>

        {filtersOpen ? (
          <div className="space-y-3.5 border-t border-border py-4">
            {availableFabrics.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Fabric
                </span>
                {availableFabrics.map((f) => (
                  <Chip key={f} active={fabric === f} onClick={() => setFabric(fabric === f ? null : f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            ) : null}
            {availableStyles.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Style
                </span>
                {availableStyles.map((s) => (
                  <Chip key={s} active={style === s} onClick={() => setStyle(style === s ? null : s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {filter ? (
        <p className="mb-5 text-[14px] text-muted-foreground">
          Showing the {filter.replace("-", " ")} edit ·{" "}
          <button type="button" onClick={() => setFilter(null)} className="text-peach-deep underline">
            show everything
          </button>
        </p>
      ) : null}

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-6">
          {visible.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-line py-20 text-center">
          <p className="font-heading text-h4">Nothing matches those filters</p>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Try removing a filter to see more prints.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-5 bg-ink px-7 py-3 text-[12.5px] font-semibold tracking-[0.14em] text-cream uppercase hover:bg-peach-deep hover:text-ink"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
