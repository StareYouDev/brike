import type { Metadata } from "next";
import { ClipboardList, Clock, Inbox, Layers, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/catalog";
import { getAdminOverview } from "@/lib/queries";

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

  const stats = [
    { label: "Products", value: products, icon: Package },
    { label: "Collections", value: collections, icon: Layers },
    { label: "Orders", value: orders, icon: ClipboardList },
    { label: "Pending orders", value: pendingOrders, icon: Clock },
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
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
              </p>
              <Icon size={16} className="text-peach-deep" aria-hidden />
            </div>
            <p className="mt-3 text-[28px] leading-none font-semibold tabular-nums">
              {value}
            </p>
          </div>
        ))}
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
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>
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
