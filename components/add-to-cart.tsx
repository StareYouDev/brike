"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice, type Product } from "@/data/catalog";
import { productImages } from "@/lib/images";
import { useColorway } from "@/components/colorway-picker";
import { cn } from "@/lib/utils";

export function AddToCart({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const { colorways, index: colorway, select } = useColorway();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);

  const selected = colorways[colorway] ?? colorways[0];
  const images = productImages(product);
  const image = images[selected?.image === "b" ? "b" : "a"];

  // Tracked sizes only — a size missing from product.stock never blocks.
  const stockOf = (s: string | null): number | undefined =>
    s === null ? undefined : product.stock?.[s];
  const maxFor = (s: string | null): number => {
    const stock = stockOf(s);
    return stock === undefined ? 10 : Math.max(1, Math.min(10, stock));
  };

  const add = () => {
    if (!size) {
      setError(true);
      return;
    }
    // Stale selection (stock ran out after this page rendered): the sold-out
    // note below is already visible, so just refuse quietly.
    if (stockOf(size) === 0) return;
    setError(false);
    addItem(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        size,
        colorway: selected?.name ?? product.name,
        image,
      },
      // Never hand the cart more than the tracked stock allows; checkout
      // re-validates server-side anyway.
      Math.min(qty, maxFor(size)),
    );
  };

  return (
    <div className="space-y-6">
      {/* colourway */}
      {selected ? (
        <div>
          <p className="mb-2.5 text-[12.5px] font-semibold tracking-[0.14em] text-ink uppercase">
            Colour:{" "}
            <span className="font-normal tracking-normal text-muted-foreground normal-case">
              {selected.name}
            </span>
          </p>
          <div className="flex gap-2.5">
            {colorways.map((cw, i) => (
              <button
                key={`${cw.name}-${i}`}
                type="button"
                aria-label={`Select colour ${cw.name}`}
                aria-pressed={colorway === i}
                onClick={() => select(i)}
                title={cw.name}
                style={{ backgroundColor: cw.hex }}
                className={cn(
                  "size-11 rounded-full border-2 transition-all",
                  colorway === i
                    ? "border-ink ring-2 ring-ink/20"
                    : "border-white/70 hover:border-ink/40",
                )}
              >
                <span className="sr-only">{cw.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* size */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[12.5px] font-semibold tracking-[0.14em] text-ink uppercase">
            Size
          </p>
          <Link
            href="/size-guide"
            className="text-[13px] text-peach-deep underline underline-offset-2"
          >
            Size guide
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const stock = stockOf(s);
            const soldOut = stock === 0;
            return (
              <button
                key={s}
                type="button"
                disabled={soldOut}
                aria-pressed={size === s}
                title={soldOut ? `${s} — sold out` : undefined}
                onClick={() => {
                  setSize(s);
                  setError(false);
                }}
                className={cn(
                  "min-w-12 border px-3.5 py-2.5 text-[14px] transition-all",
                  soldOut
                    ? "cursor-not-allowed border-input text-muted-foreground/50 line-through"
                    : size === s
                      ? "border-ink bg-ink text-cream"
                      : "border-input hover:border-ink",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
        {(() => {
          if (!size) return null;
          const stock = product.stock?.[size];
          if (stock === undefined) return null;
          if (stock === 0) {
            return (
              <p role="status" className="mt-2 text-[13px] text-sale">
                {size} is sold out — pick another size.
              </p>
            );
          }
          if (stock <= 5) {
            return (
              <p role="status" className="mt-2 text-[13px] text-sale">
                Only {stock} left in {size} — going fast.
              </p>
            );
          }
          return null;
        })()}
        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-sale">
            Please choose a size.
          </p>
        ) : null}
      </div>

      {/* qty + add */}
      <div className="flex gap-3">
        <div className="flex items-center border border-input">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3.5 py-3.5 text-lg hover:bg-meta"
          >
            −
          </button>
          <span className="min-w-8 text-center text-[15px]">
            {Math.min(qty, maxFor(size))}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() =>
              setQty((q) => Math.min(maxFor(size), Math.min(10, q + 1)))
            }
            className="px-3.5 py-3.5 text-lg hover:bg-meta"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={stockOf(size) === 0}
          className="group flex flex-1 items-center justify-center gap-2.5 bg-ink py-3.5 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink disabled:cursor-not-allowed disabled:bg-muted-foreground/40"
        >
          <ShoppingBag size={16} className="transition-transform group-hover:scale-110" />
          Add to basket · {formatPrice(product.price * Math.min(qty, maxFor(size)))}
        </button>
      </div>

      <ul className="space-y-1.5 border-t border-border pt-5 text-[13.5px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check size={14} className="text-forest" /> Free UK delivery over £60
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-forest" /> 30-day easy returns
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} className="text-forest" /> {siteCharityLine()}
        </li>
      </ul>
    </div>
  );
}

function siteCharityLine() {
  return "20% of kids’ profits go to our chosen charity";
}
