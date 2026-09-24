"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice, type Product } from "@/data/catalog";
import { productImages } from "@/lib/images";
import { cn } from "@/lib/utils";

export function AddToCart({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [size, setSize] = useState<string | null>(null);
  const [colorway, setColorway] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);

  const images = productImages(product);
  const image = colorway === 0 ? images.a : images.b;

  const add = () => {
    if (!size) {
      setError(true);
      return;
    }
    setError(false);
    addItem(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        size,
        colorway: product.colorways[colorway],
        image,
      },
      qty,
    );
  };

  return (
    <div className="space-y-6">
      {/* colourway */}
      <div>
        <p className="mb-2.5 text-[12.5px] font-semibold tracking-[0.14em] text-ink uppercase">
          Colour:{" "}
          <span className="font-normal tracking-normal text-muted-foreground normal-case">
            {product.colorways[colorway]}
          </span>
        </p>
        <div className="flex gap-2.5">
          {product.colorways.map((cw, i) => (
            <button
              key={cw}
              type="button"
              aria-label={`Select colour ${cw}`}
              aria-pressed={colorway === i}
              onClick={() => setColorway(i)}
              className={cn(
                "relative h-11 w-11 overflow-hidden rounded-full border-2 transition-all",
                colorway === i
                  ? "border-ink ring-2 ring-ink/20"
                  : "border-transparent hover:border-ink/30",
              )}
            >
              <span
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${i === 0 ? images.a : images.b})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* size */}
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <p className="text-[12.5px] font-semibold tracking-[0.14em] text-ink uppercase">
            Size
          </p>
          <Link
            href="/contact#size-guide"
            className="text-[13px] text-peach-deep underline underline-offset-2"
          >
            Size guide
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setError(false);
              }}
              className={cn(
                "min-w-12 border px-3.5 py-2.5 text-[14px] transition-all",
                size === s
                  ? "border-ink bg-ink text-cream"
                  : "border-input hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
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
          <span className="min-w-8 text-center text-[15px]">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="px-3.5 py-3.5 text-lg hover:bg-meta"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          className="group flex flex-1 items-center justify-center gap-2.5 bg-ink py-3.5 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
        >
          <ShoppingBag size={16} className="transition-transform group-hover:scale-110" />
          Add to basket · {formatPrice(product.price * qty)}
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
