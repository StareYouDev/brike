import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { ListPagination, parsePage } from "@/components/admin/list-pagination";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

/** Rows per page of the unfiltered list (?q= results are never paged). */
const PAGE_SIZE = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: raw, page: rawPage } = await searchParams;
  const q = typeof raw === "string" ? raw.trim() : "";
  const all = await getAdminProducts(q || undefined);
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const page = q
    ? 1
    : parsePage(typeof rawPage === "string" ? rawPage : undefined, totalPages);
  const items = q ? all : all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {q
              ? `${all.length} match${all.length === 1 ? "" : "es"} for “${q}”`
              : `${all.length} product${all.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </header>

      <form
        method="get"
        action="/admin/products"
        className="flex max-w-md gap-2"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name or slug…"
          aria-label="Search products"
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <Package
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="text-[15px] font-medium">
            {q ? "No matches" : "No products yet"}
          </p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            {q
              ? `Nothing matches “${q}”. Try another name or slug.`
              : "Create your first product to stock the shop."}
          </p>
          {q ? null : (
            <Button asChild className="mt-2">
              <Link href="/admin/products/new">New product</Link>
            </Button>
          )}
        </div>
      ) : (
        <ProductsTable
          items={items}
          reorderable={!q}
          offset={q ? 0 : (page - 1) * PAGE_SIZE}
        />
      )}

      {q ? null : (
        <ListPagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/products"
        />
      )}
    </div>
  );
}
