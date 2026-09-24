import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/data/catalog";
import {
  isOrderStatus,
  ORDER_STATUSES,
  STATUS_LABELS,
} from "@/lib/admin-form";
import { cn } from "@/lib/utils";
import { getAdminOrders } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const placedFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const status =
    typeof raw === "string" && isOrderStatus(raw) ? raw : undefined;
  const items = await getAdminOrders(status);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Fulfilment
        </p>
        <h1 className="mt-1.5 font-heading text-h3">Orders</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {items.length} order{items.length === 1 ? "" : "s"}
          {status ? ` · ${STATUS_LABELS[status]}` : ""} · cash on delivery
        </p>
      </header>

      <nav
        aria-label="Filter by status"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((filter) => {
          const active =
            filter.value === "" ? !status : filter.value === status;
          const href =
            filter.value === ""
              ? "/admin/orders"
              : `/admin/orders?status=${filter.value}`;
          return (
            <Link
              key={filter.value || "all"}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-border bg-background text-ink/70 hover:border-ink/30 hover:text-ink",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-6 py-14 text-center">
          <ClipboardList
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="font-heading text-h5">
            {status ? `No ${STATUS_LABELS[status].toLowerCase()} orders` : "No orders yet"}
          </p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            {status
              ? "Try another status, or clear the filter to see everything."
              : "Cash-on-delivery orders placed at checkout will appear here, ready to confirm and dispatch."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.code}</TableCell>
                  <TableCell>
                    <p>{order.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {order.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatPrice(order.totalPence / 100)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {placedFormatter.format(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>Open</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
