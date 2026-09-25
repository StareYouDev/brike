import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { CollectionsTable } from "@/components/admin/collections-table";
import { ListPagination, parsePage } from "@/components/admin/list-pagination";
import { Button } from "@/components/ui/button";
import { getAdminCollections } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Collections",
  robots: { index: false, follow: false },
};

/** Rows per page of the collections list. */
const PAGE_SIZE = 5;

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const all = await getAdminCollections();
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const page = parsePage(typeof rawPage === "string" ? rawPage : undefined, totalPages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {all.length} collection{all.length === 1 ? "" : "s"} · powers
            the mega menu
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/new">New collection</Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <Layers
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="text-[15px] font-medium">No collections yet</p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            Collections group products into the shop&apos;s navigation.
          </p>
          <Button asChild className="mt-2">
            <Link href="/admin/collections/new">New collection</Link>
          </Button>
        </div>
      ) : (
        <CollectionsTable items={items} offset={(page - 1) * PAGE_SIZE} />
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/collections"
      />
    </div>
  );
}
