import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import { deleteCollectionAction } from "@/lib/actions/collections";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collectionImage } from "@/lib/images";
import { getAdminCollections } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Collections",
  robots: { index: false, follow: false },
};

export default async function AdminCollectionsPage() {
  const items = await getAdminCollections();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
            Catalogue
          </p>
          <h1 className="mt-1.5 font-heading text-h3">Collections</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {items.length} collection{items.length === 1 ? "" : "s"} · powers
            the mega menu
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/new">New collection</Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-6 py-14 text-center">
          <Layers
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="font-heading text-h5">No collections yet</p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            Collections group products into the shop&apos;s navigation.
          </p>
          <Button asChild className="mt-2">
            <Link href="/admin/collections/new">New collection</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Banner</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Short label</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="w-16 text-right">Sort</TableHead>
                <TableHead className="w-44 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded border border-border bg-meta">
                      <Image
                        src={collectionImage({
                          slug: collection.slug,
                          image: collection.image ?? undefined,
                        })}
                        alt=""
                        fill
                        unoptimized
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/collections/${collection.id}`}
                      className="font-medium transition-colors hover:text-peach-deep"
                    >
                      {collection.title}
                    </Link>
                    <p className="text-[12px] text-muted-foreground">
                      /collections/{collection.slug}
                    </p>
                  </TableCell>
                  <TableCell className="text-[13.5px]">
                    {collection.shortTitle}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {collection.productCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {collection.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/collections/${collection.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteButton
                        action={deleteCollectionAction.bind(
                          null,
                          collection.id,
                        )}
                        subject={`“${collection.title}”`}
                      />
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
