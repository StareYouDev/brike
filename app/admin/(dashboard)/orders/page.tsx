import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { ListPagination, parsePage } from "@/components/admin/list-pagination";
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

/** Rows per page of the orders list. */
const PAGE_SIZE = 5;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: raw, page: rawPage } = await searchParams;
  const status =
    typeof raw === "string" && isOrderStatus(raw) ? raw : undefined;
  const all = await getAdminOrders(status);
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const page = parsePage(
    typeof rawPage === "string" ? rawPage : undefined,
    totalPages,
  );
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {all.length} order{all.length === 1 ? "" : "s"}
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
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-ink",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <ClipboardList
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="text-[15px] font-medium">
            {status ? `No ${STATUS_LABELS[status].toLowerCase()} orders` : "No orders yet"}
          </p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            {status
              ? "Try another status, or clear the filter to see everything."
              : "Cash-on-delivery orders placed at checkout will appear here, ready to confirm and dispatch."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
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

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/orders"
        searchParams={status ? { status } : {}}
      />
    </div>
  );
}
