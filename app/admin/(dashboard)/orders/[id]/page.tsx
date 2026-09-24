import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/catalog";
import { parseUuid } from "@/lib/admin-auth";
import { getAdminOrder } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

const placedFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-medium">{title}</h2>
      </div>
      <div className="space-y-3 px-5 py-4">{children}</div>
    </section>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uuid = parseUuid(id);
  const order = uuid ? await getAdminOrder(uuid) : null;
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden />
            All orders
          </Link>
          <div className="mt-1.5 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{order.code}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Placed {placedFormatter.format(order.createdAt)} · payment:{" "}
            {order.paymentMethod}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* ---- left: items + totals + notes ---- */}
        <div className="space-y-4">
          <SectionCard title={`Items (${order.items.length})`}>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={`${item.slug}-${item.size}-${item.colorway}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded border border-border bg-meta">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-medium transition-colors underline-offset-2 hover:underline decoration-peach-deep"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[12.5px] text-muted-foreground">
                      Size {item.size} · {item.colorway} ·{" "}
                      {formatPrice(item.unitPricePence / 100)} × {item.qty}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatPrice((item.unitPricePence * item.qty) / 100)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Totals">
            <dl className="space-y-1.5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatPrice(order.subtotalPence / 100)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">
                  {order.deliveryPence === 0
                    ? "Free"
                    : formatPrice(order.deliveryPence / 100)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatPrice(order.totalPence / 100)}
                </dd>
              </div>
            </dl>
            <p className="rounded-md bg-meta px-3 py-2 text-[12.5px] text-muted-foreground">
              Payment method: cash on delivery — collect{" "}
              {formatPrice(order.totalPence / 100)} on handover.
            </p>
          </SectionCard>

          {order.notes ? (
            <SectionCard title="Customer notes">
              <p className="whitespace-pre-wrap text-[14px]">
                {order.notes}
              </p>
            </SectionCard>
          ) : null}
        </div>

        {/* ---- right: fulfilment, customer, address ---- */}
        <div className="space-y-4">
          <SectionCard title="Fulfilment">
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              action={updateOrderStatusAction}
            />
            <p className="text-[12px] text-muted-foreground">
              Last updated {placedFormatter.format(order.updatedAt)}
            </p>
          </SectionCard>

          <SectionCard title="Customer">
            <div className="space-y-1 text-[14px]">
              <p className="font-medium">{order.name}</p>
              <p>
                <a
                  href={`mailto:${order.email}`}
                  className="text-ink underline decoration-peach-deep decoration-2 underline-offset-2 transition-colors hover:decoration-ink"
                >
                  {order.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${order.phone.replace(/\s+/g, "")}`}
                  className="text-muted-foreground transition-colors hover:text-ink"
                >
                  {order.phone}
                </a>
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Shipping address">
            <address className="space-y-0.5 text-[14px] not-italic">
              <p>{order.name}</p>
              <p>{order.address1}</p>
              {order.address2 ? <p>{order.address2}</p> : null}
              <p>
                {order.city}, {order.postcode}
              </p>
              <p>{order.country}</p>
            </address>
          </SectionCard>
        </div>
      </div>

      <div className="flex justify-start">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">Back to catalogue</Link>
        </Button>
      </div>
    </div>
  );
}
