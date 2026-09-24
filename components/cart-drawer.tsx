"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cartKey, cartSubtotal, useCart } from "@/store/cart";
import { formatPrice, site } from "@/data/catalog";

export function CartDrawer() {
  const { items, isOpen, close, setQty, removeItem } = useCart();
  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, site.freeShippingThreshold - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? close() : null)}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="font-heading text-h4">Your basket</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag size={38} strokeWidth={1.2} className="text-muted-foreground" />
            <p className="font-heading text-h5">Your basket is empty</p>
            <p className="text-[14.5px] text-muted-foreground">
              Cosy pyjamas are waiting — start with the new prints.
            </p>
            <Link
              href="/collections/new-in"
              onClick={close}
              className="mt-2 bg-ink px-7 py-3 text-[13px] font-semibold tracking-[0.14em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
            >
              Shop new in
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border bg-meta px-6 py-3 text-[13px]">
              {remaining > 0 ? (
                <span>
                  Add <strong>{formatPrice(remaining)}</strong> more for free UK delivery
                </span>
              ) : (
                <span className="font-medium text-forest">✓ You&apos;ve got free UK delivery</span>
              )}
            </div>

            <ul className="flex-1 overflow-y-auto px-6">
              {items.map((item) => {
                const key = cartKey(item);
                return (
                  <li key={key} className="flex gap-4 border-b border-border py-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={80}
                      unoptimized
                      className="shrink-0 rounded-sm object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="text-[14.5px] leading-snug font-medium hover:text-peach-deep"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(key)}
                          className="text-muted-foreground transition-colors hover:text-sale"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {item.colorway} · Size {item.size}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(key, item.qty - 1)}
                            className="px-2 py-1 hover:bg-meta"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-7 text-center text-[14px]">{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQty(key, item.qty + 1)}
                            className="px-2 py-1 hover:bg-meta"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-[14.5px] font-semibold">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-3 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between text-[15px]">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                Delivery calculated at checkout · {site.currency}
                {site.standardDelivery.toFixed(2)} standard, free over {formatPrice(site.freeShippingThreshold)}
              </p>
              <Link
                href="/checkout"
                onClick={close}
                className="block w-full bg-ink py-3.5 text-center text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
              >
                Checkout · {formatPrice(subtotal)}
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
