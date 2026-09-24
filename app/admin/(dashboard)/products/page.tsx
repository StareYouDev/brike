import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { deleteProductAction } from "@/lib/actions/products";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/data/catalog";
import { productImages } from "@/lib/images";
import { getAdminProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw.trim() : "";
  const items = await getAdminProducts(q || undefined);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
            Catalogue
          </p>
          <h1 className="mt-1.5 font-heading text-h3">Products</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {q
              ? `${items.length} match${items.length === 1 ? "" : "es"} for “${q}”`
              : `${items.length} product${items.length === 1 ? "" : "s"}`}
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
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background px-6 py-14 text-center">
          <Package
            size={26}
            strokeWidth={1.4}
            className="text-muted-foreground"
            aria-hidden
          />
          <p className="font-heading text-h5">
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
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="w-16 text-right">Sort</TableHead>
                <TableHead className="w-44 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => {
                const images = productImages({
                  slug: product.slug,
                  imageA: product.imageA ?? undefined,
                  imageB: product.imageB ?? undefined,
                });
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded border border-border bg-meta">
                        <Image
                          src={images.a}
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
                        href={`/admin/products/${product.id}`}
                        className="font-medium transition-colors hover:text-peach-deep"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[12px] text-muted-foreground">
                        /products/{product.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          product.compareAtPence !== null
                            ? "font-semibold text-sale"
                            : "font-medium"
                        }
                      >
                        {formatPrice(product.pricePence / 100)}
                      </span>
                      {product.compareAtPence !== null ? (
                        <p className="text-[12px] text-muted-foreground line-through">
                          {formatPrice(product.compareAtPence / 100)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {product.badge ? (
                        <Badge variant="outline">{product.badge}</Badge>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {product.collections.length === 0 ? (
                          <span className="text-[12px] text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <>
                            {product.collections.slice(0, 2).map((slug) => (
                              <Badge
                                key={slug}
                                variant="secondary"
                                className="font-normal"
                              >
                                {slug}
                              </Badge>
                            ))}
                            {product.collections.length > 2 ? (
                              <span className="text-[12px] text-muted-foreground">
                                +{product.collections.length - 2}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.featured ? (
                        <span
                          title="Featured"
                          aria-label="Featured"
                          className="text-peach-deep"
                        >
                          ★
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product.sortOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/products/${product.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteButton
                          action={deleteProductAction.bind(null, product.id)}
                          subject={`“${product.name}”`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
