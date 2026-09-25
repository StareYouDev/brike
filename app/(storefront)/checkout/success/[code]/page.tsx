import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, Check } from "lucide-react";
import { ClearCart } from "@/components/clear-cart";
import { formatPrice } from "@/data/catalog";
import { ORDER_CODE_RE } from "@/lib/checkout";
import { emailsEnabled } from "@/lib/email";
import { getOrderByCode } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

/**
 * Public confirmation keyed by the unguessable BRK-XXXXXX code (random,
 * unique, no sequential ids in URLs). Renders once per request so the
 * freshest status/totals are always shown; the basket empties client-side.
 */
export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!ORDER_CODE_RE.test(code)) notFound();
  const order = await getOrderByCode(code);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-[860px] px-6 pt-10 pb-24">
      <ClearCart />

      <div className="border border-forest/40 bg-forest/5 p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest text-cream">
          <Check size={24} strokeWidth={2.5} aria-hidden />
        </span>
        <h1 className="mt-5 font-heading text-h2">
          Thank you — your order is in
        </h1>
        <p className="mt-3 text-[15.5px] text-foreground/80">
          A confirmation is on its way to{" "}
          <span className="font-medium">{order.email}</span>. Your reference:{" "}
          <strong data-testid="order-code">{order.code}</strong>
        </p>
        <p className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[14.5px] text-ink/75">
          <Banknote size={17} className="text-peach-deep" aria-hidden />
          Have <strong>{formatPrice(order.totalPence / 100)}</strong> ready in
          cash — payment is taken on delivery (2–4 working days).
        </p>
      </div>

      <section className="mt-8 border border-border p-6">
        <h2 className="font-heading text-h5">What&apos;s on the way</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item, index) => (
            <li
              key={`${item.slug}-${index}`}
              className="flex gap-4 py-4 first:pt-0 last:pb-0"
            >
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
                  className="text-[14.5px] leading-snug font-medium hover:text-peach-deep"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {item.colorway} · Size {item.size} · Qty {item.qty}
                </p>
              </div>
              <span className="text-[14.5px] font-semibold">
                {formatPrice((item.unitPricePence * item.qty) / 100)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotalPence / 100)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>
              {order.deliveryPence === 0 ? (
                <span className="font-medium text-forest">Free</span>
              ) : (
                formatPrice(order.deliveryPence / 100)
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-[17px] font-semibold">
            <dt>Total (cash on delivery)</dt>
            <dd>{formatPrice(order.totalPence / 100)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 border border-border p-6">
        <h2 className="font-heading text-h5">Delivering to</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/80">
          {order.name}
          <br />
          {order.address1}
          {order.address2 ? (
            <>
              <br />
              {order.address2}
            </>
          ) : null}
          <br />
          {order.city}, {order.postcode}
          <br />
          {order.country}
        </p>
        <p className="mt-3 text-[13.5px] text-muted-foreground">
          {emailsEnabled()
            ? "Questions about the order? Reply to your confirmation email or call the studio — quote reference "
            : "Questions about the order? Call the studio — quote reference "}
          {order.code}.
        </p>
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
