"use client";

import {
  useActionState,
  useSyncExternalStore,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Banknote, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/data/catalog";
import {
  placeOrderAction,
  previewDiscountAction,
} from "@/lib/actions/checkout";
import { deliveryPenceFor } from "@/lib/checkout";
import {
  DEFAULT_CHECKOUT_COPY,
  type CheckoutFormCopy,
} from "@/lib/form-copy";
import { cartKey, cartSubtotal, useCart } from "@/store/cart";

// 16px is deliberate: anything smaller makes mobile Safari zoom into the
// field on focus, which breaks the page's responsive feel on iPhones.
const field =
  "w-full border border-input bg-white px-4 py-3 text-[16px] outline-none transition-colors focus:border-ink";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p role="alert" className="mt-1.5 text-[13px] text-sale">
      {messages[0]}
    </p>
  );
}

// Standard "mounted" gate via useSyncExternalStore (no setState-in-effect):
// false during SSR + hydration, true on the post-hydration re-check. The
// persisted zustand basket only exists client-side, so server markup and the
// first client render must both see it as empty.
const subscribeNothing = () => () => {};
const getMounted = () => true;
const getNotMounted = () => false;

export function CheckoutForm({
  settings,
}: {
  settings?: Partial<CheckoutFormCopy>;
}) {
  // Admin-managed copy (lib/form-settings) with the shipped defaults beneath.
  const copy = { ...DEFAULT_CHECKOUT_COPY, ...settings };
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const [state, formAction, pending] = useActionState(placeOrderAction, {});
  // Promo code: typed into the visible input (submitted with the form and
  // re-validated server-side); "Apply" only previews the saving — it never
  // consumes the code.
  const [discountInput, setDiscountInput] = useState("");
  const [preview, setPreview] = useState<{
    code: string;
    percentOff: number;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();

  const mounted = useSyncExternalStore(
    subscribeNothing,
    getMounted,
    getNotMounted,
  );

  if (!mounted) {
    return (
      <div aria-busy="true" className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="space-y-4">
          <div className="h-8 w-1/2 animate-pulse bg-meta" />
          <div className="h-12 animate-pulse bg-meta" />
          <div className="h-12 animate-pulse bg-meta" />
          <div className="h-12 animate-pulse bg-meta" />
        </div>
        <div className="h-56 animate-pulse bg-meta" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border border-border bg-background px-6 py-16 text-center">
        <ShoppingBag size={34} strokeWidth={1.2} className="text-muted-foreground" />
        <p className="font-heading text-h4">Your basket is empty</p>
        <p className="max-w-sm text-[14.5px] text-muted-foreground">
          Nothing to check out yet — pick a print and it will show up here.
        </p>
        <Link
          href="/collections/new-in"
          className="mt-2 bg-ink px-7 py-3 text-[13px] font-semibold tracking-[0.14em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
        >
          Shop new in
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items); // pounds
  const subtotalPence = Math.round(subtotal * 100);
  // The preview returns a percentage so the saving stays correct as the
  // basket changes; the server recomputes the same formula authoritatively.
  const discountPence = preview
    ? Math.floor((subtotalPence * preview.percentOff) / 100)
    : 0;
  // Free-delivery threshold applies to the discounted subtotal — mirrors
  // placeOrderAction exactly.
  const deliveryPence = deliveryPenceFor(subtotalPence - discountPence);
  const totalPence = subtotalPence - discountPence + deliveryPence;
  const basket = JSON.stringify(
    items.map(({ slug, size, colorway, qty }) => ({ slug, size, colorway, qty })),
  );

  const applyCode = () => {
    const code = discountInput.trim();
    const emailEl = document.getElementById(
      "co-email",
    ) as HTMLInputElement | null;
    const email = emailEl?.value.trim() ?? "";
    if (!code) {
      setPreview(null);
      setPreviewError("Enter a discount code.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setPreviewError("Enter your email address first — codes are tied to it.");
      return;
    }
    setPreviewError(null);
    startPreview(async () => {
      const fd = new FormData();
      fd.set("discount", code);
      fd.set("email", email);
      const res = await previewDiscountAction({}, fd);
      if (res.ok && res.code && typeof res.percentOff === "number") {
        setPreview({ code: res.code, percentOff: res.percentOff });
      } else {
        setPreview(null);
        setPreviewError(res.error ?? "That discount code isn't valid.");
      }
    });
  };

  const removeCode = () => {
    setDiscountInput("");
    setPreview(null);
    setPreviewError(null);
  };

  return (
    <>
      <form
        id="checkout-form"
        action={formAction}
        className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
      >
        {/* Server-side recompute reads ONLY these keys — never price/image. */}
        <input type="hidden" name="basket" value={basket} />
        {/* Honeypot: off-screen, unfocusable, hidden from AT — bots fill it. */}
        <div
          aria-hidden
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label>
            Leave this field empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-md border border-sale/40 bg-sale/5 px-4 py-3 text-[14px] text-sale lg:col-span-2"
          >
            {state.error}
          </p>
        ) : null}

        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-h4">{copy.detailsHeading}</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {copy.detailsNote}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="co-email" className="block text-[13px] font-medium">
                Email address
              </label>
              <input
                id="co-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.email} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="co-name" className="block text-[13px] font-medium">
                Full name
              </label>
              <input
                id="co-name"
                name="name"
                required
                autoComplete="name"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.name} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="co-phone" className="block text-[13px] font-medium">
                Phone number
              </label>
              <input
                id="co-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="For the courier only"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.phone} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="co-address1" className="block text-[13px] font-medium">
                Address line 1
              </label>
              <input
                id="co-address1"
                name="address1"
                required
                autoComplete="address-line1"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.address1} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="co-address2" className="block text-[13px] font-medium">
                Address line 2 (optional)
              </label>
              <input
                id="co-address2"
                name="address2"
                autoComplete="address-line2"
                className={field}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="co-city" className="block text-[13px] font-medium">
                Town or city
              </label>
              <input
                id="co-city"
                name="city"
                required
                autoComplete="address-level2"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.city} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="co-postcode" className="block text-[13px] font-medium">
                Postcode
              </label>
              <input
                id="co-postcode"
                name="postcode"
                required
                autoComplete="postal-code"
                className={field}
              />
              <FieldError messages={state.fieldErrors?.postcode} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="co-notes" className="block text-[13px] font-medium">
                Order notes (optional)
              </label>
              <textarea
                id="co-notes"
                name="notes"
                rows={3}
                maxLength={500}
                placeholder="Safe place, working doorbell, best time to knock…"
                className={`${field} resize-y`}
              />
            </div>
          </div>

          <div className="border border-ink/25 bg-peach/40 p-4">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">
              <Banknote size={16} className="text-peach-deep" aria-hidden />
              {copy.payNoteHeading}
            </p>
            <p className="mt-1.5 text-[13.5px] text-ink/75">
              {copy.payNoteBody.replace(
                "{total}",
                formatPrice(totalPence / 100),
              )}
            </p>
          </div>
        </div>

        <aside className="border border-border bg-background p-6 lg:sticky lg:top-40 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-h4">{copy.basketHeading}</h2>
            <button
              type="button"
              onClick={openCart}
              className="-my-2 py-3.5 text-[13px] text-peach-deep underline underline-offset-2"
            >
              Edit basket
            </button>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <li key={cartKey(item)} className="flex gap-4 py-4">
                <Image
                  src={item.image}
                  alt=""
                  width={56}
                  height={70}
                  unoptimized
                  className="shrink-0 rounded-sm object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/products/${item.slug}`}
                    className="block py-3 text-[14.5px] leading-snug font-medium hover:text-peach-deep"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {item.colorway} · Size {item.size} · Qty {item.qty}
                  </p>
                </div>
                <span className="text-[14.5px] font-semibold">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-border pt-4">
            <label htmlFor="co-discount" className="block text-[13px] font-medium">
              Discount code
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="co-discount"
                name="discount"
                size={1}
                value={discountInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDiscountInput(value);
                  setPreviewError(null);
                  if (preview && value.trim().toUpperCase() !== preview.code) {
                    setPreview(null);
                  }
                }}
                placeholder="e.g. WELCOME10"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 border border-input bg-white px-3 py-3 text-[16px] outline-none transition-colors focus:border-ink"
              />
              <button
                type="button"
                onClick={applyCode}
                disabled={previewPending}
                className="shrink-0 border border-ink px-3.5 text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors hover:bg-ink hover:text-cream disabled:opacity-60"
              >
                {previewPending ? "…" : preview ? "Update" : "Apply"}
              </button>
            </div>
            {preview ? (
              <div className="mt-2 flex items-center justify-between gap-2 border border-forest/40 bg-forest/5 px-3 py-2 text-[13px]">
                <span>
                  <strong>{preview.code}</strong> applied
                </span>
                <button
                  type="button"
                  onClick={removeCode}
                  aria-label="Remove discount code"
                  className="-mr-2 -my-3 px-2 py-3.5 text-[12.5px] text-muted-foreground underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ) : null}
            {previewError ? (
              <p role="alert" className="mt-1.5 text-[13px] text-sale">
                {previewError}
              </p>
            ) : null}
            <FieldError messages={state.fieldErrors?.discount} />
          </div>

          <dl className="space-y-2 border-t border-border pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {preview && discountPence > 0 ? (
              <div className="flex justify-between text-forest">
                <dt>Discount · {preview.code}</dt>
                <dd>−{formatPrice(discountPence / 100)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>
                {deliveryPence === 0 ? (
                  <span className="font-medium text-forest">Free</span>
                ) : (
                  formatPrice(deliveryPence / 100)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-[17px] font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(totalPence / 100)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={pending}
            className="mt-5 hidden w-full bg-ink py-4 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink disabled:opacity-60 lg:block"
          >
            {pending
              ? "Placing order…"
              : `${copy.submitLabel} · ${formatPrice(totalPence / 100)}`}
          </button>
          <p className="mt-3 text-[12.5px] text-muted-foreground">
            {copy.footnote}
          </p>
        </aside>
      </form>
      {/* Mobile keeps the total + submit pinned while the long form scrolls.
          It lives outside the <form> (a grid item can't stick within its own
          cell) so its sticky containing block spans the whole form, and it
          posts via the form= association. It unpins at the end of the form,
          so the footer is never covered. */}
      <div className="sticky bottom-0 z-40 -mx-6 mt-6 border-t border-border bg-background/95 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(15,15,15,0.08)] backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Total
            </p>
            <p className="text-[17px] leading-tight font-semibold">
              {formatPrice(totalPence / 100)}
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={pending}
            className="min-w-0 flex-1 bg-ink py-4 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink disabled:opacity-60"
          >
            {pending ? "Placing order…" : copy.submitLabel}
          </button>
        </div>
      </div>
    </>
  );
}
