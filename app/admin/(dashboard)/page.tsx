import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Clock, Inbox, Layers, Package } from "lucide-react";
import { OrdersChart } from "@/components/admin/orders-chart";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/data/catalog";
import { getAdminDailyOrders, getAdminOverview } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminOverviewPage() {
  const { products, collections, orders, pendingOrders, recentOrders } =
    await getAdminOverview();
  const daily = await getAdminDailyOrders(14);
  const orders14 = daily.reduce((sum, day) => sum + day.orders, 0);

  const stats = [
    {
      label: "Products",
      value: products,
      icon: Package,
      href: "/admin/products",
      foot: "Manage products",
    },
    {
      label: "Collections",
      value: collections,
      icon: Layers,
      href: "/admin/collections",
      foot: "Manage collections",
    },
    {
      label: "Orders",
      value: orders,
      icon: ClipboardList,
      href: "/admin/orders",
      foot: "All time · cash on delivery",
    },
    {
      label: "Pending orders",
      value: pendingOrders,
      icon: Clock,
      href: "/admin/orders?status=pending",
      foot: "Awaiting confirmation",
    },
  ];

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Dashboard
        </p>
        <h1 className="mt-1.5 font-heading text-h3">Overview</h1>
      </header>

      <section
        aria-label="Store statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, icon: Icon, href, foot }) => (
          <Card key={label} className="@container/card">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-[28px] leading-none font-semibold tabular-nums @[250px]/card:text-3xl">
                {value}
              </CardTitle>
              <CardAction>
                <span className="rounded-md bg-peach/40 p-2 text-peach-deep">
                  <Icon size={16} aria-hidden />
                </span>
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Link
                href={href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-ink"
              >
                {foot} →
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section aria-label="Order activity">
        {orders14 > 0 ? (
          <OrdersChart data={daily} />
        ) : (
          <Card className="@container/card">
            <CardHeader>
              <CardTitle>Order activity</CardTitle>
              <CardDescription>
                Last 14 days — cash on delivery
              </CardDescription>
            </CardHeader>
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Inbox
                size={26}
                strokeWidth={1.4}
                className="text-muted-foreground"
                aria-hidden
              />
              <p className="font-heading text-h5">Quiet so far</p>
              <p className="max-w-md text-[13.5px] text-muted-foreground">
                The activity chart starts drawing as soon as the first
                cash-on-delivery order lands.
              </p>
            </div>
          </Card>
        )}
      </section>

      <section
        aria-labelledby="recent-orders-heading"
        className="rounded-lg border border-border bg-background"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="recent-orders-heading" className="font-heading text-h5">
            Recent orders
          </h2>
          <span className="text-[12.5px] text-muted-foreground">
            Cash on delivery
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <Inbox
              size={26}
              strokeWidth={1.4}
              className="text-muted-foreground"
              aria-hidden
            />
            <p className="font-heading text-h5">No orders yet</p>
            <p className="max-w-sm text-[13.5px] text-muted-foreground">
              Cash-on-delivery orders placed at checkout will appear here,
              ready to confirm and dispatch.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentOrders.map((order) => (
              <li
                key={order.code}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[14px]"
              >
                <div>
                  <p className="font-medium">{order.code}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {order.name} · {dateFormatter.format(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
