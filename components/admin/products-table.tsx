"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import {
  deleteProductAction,
  reorderProductsAction,
} from "@/lib/actions/products";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
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
import { productImages } from "@/lib/images";

/** Plain row data handed over by the server products page. */
export interface ProductTableRow {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  badge: string | null;
  featured: boolean;
  sortOrder: number;
  imageA: string | null;
  imageB: string | null;
  collections: string[];
}

const orderKey = (rows: ProductTableRow[]) =>
  rows.map((row) => row.id).join("|");

/**
 * Admin products table with drag-and-drop reordering.
 *
 * Drops (or ↑/↓ on a row's grip button) reorder optimistically and persist
 * through `reorderProductsAction` — no separate "save" step. The server
 * validates the visible slice against the global order, so reordering is
 * disabled while a search filters the rows; a failed save rolls the table
 * back to server truth.
 */
export function ProductsTable({
  items,
  reorderable,
  offset,
}: {
  items: ProductTableRow[];
  /** Reordering needs the full list — off while `?q=` filters the rows. */
  reorderable: boolean;
  /** Where this page's rows start in the global sort (pagination slice). */
  offset: number;
}) {
  // Optimistic order: the ids the admin last arranged. Derived against the
  // server's `items` on every render, so revalidations (deletes, refreshes)
  // flow through automatically — no sync effect needed.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const rows = useMemo(() => {
    if (!reorderable || !localOrder) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered: ProductTableRow[] = [];
    for (const id of localOrder) {
      const item = byId.get(id);
      if (item) {
        ordered.push(item);
        byId.delete(id);
      }
    }
    // Products that appeared after this arrangement keep their server slot.
    for (const item of items) {
      if (byId.has(item.id)) ordered.push(item);
    }
    return ordered;
  }, [items, localOrder, reorderable]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overBefore, setOverBefore] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const persist = (next: ProductTableRow[]) => {
    if (orderKey(next) === orderKey(rows)) return;
    const ids = next.map((row) => row.id);
    setLocalOrder(ids);
    setSaveError(null);
    startTransition(async () => {
      let error: string | undefined;
      try {
        error = (await reorderProductsAction(ids, offset)).error;
      } catch {
        error = "Saving the order failed. Please try again.";
      }
      if (error) {
        // Roll back to the server's order (items still hold it).
        setSaveError(error);
        setLocalOrder(null);
      }
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const id = rows[from].id;
    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persist(next);
    // React may relocate the row's DOM node; keep keyboard focus with it.
    requestAnimationFrame(() => {
      document.getElementById(`reorder-${id}`)?.focus();
    });
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      endDrag();
      return;
    }
    const next = rows.slice();
    const from = next.findIndex((row) => row.id === dragId);
    if (from < 0) {
      endDrag();
      return;
    }
    const [moved] = next.splice(from, 1);
    const target = next.findIndex((row) => row.id === targetId);
    next.splice(overBefore ? target : target + 1, 0, moved);
    endDrag();
    persist(next);
  };

  const status = saveError ? (
    <span role="alert" className="text-destructive">
      {saveError}
    </span>
  ) : isPending ? (
    <span className="text-muted-foreground">Saving order…</span>
  ) : null;

  return (
    <div className="space-y-2">
      <div aria-live="polite" className="min-h-5 text-[13px]">
        {status}
      </div>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Reorder</span>
              </TableHead>
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
            {rows.map((product) => {
              const images = productImages({
                slug: product.slug,
                imageA: product.imageA ?? undefined,
                imageB: product.imageB ?? undefined,
              });
              const isDragging = dragId === product.id;
              const isOver = overId === product.id;
              const rowClassName = [
                isDragging && "opacity-40",
                isOver &&
                  "bg-peach/10 " +
                    (overBefore
                      ? "shadow-[inset_0_3px_0_0_var(--color-peach-deep)]"
                      : "shadow-[inset_0_-3px_0_0_var(--color-peach-deep)]"),
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <TableRow
                  key={product.id}
                  className={rowClassName}
                  draggable={reorderable && !isPending}
                  onDragStart={(event) => {
                    setDragId(product.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", product.id);
                  }}
                  onDragOver={(event) => {
                    if (!reorderable || !dragId || dragId === product.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    const rect = event.currentTarget.getBoundingClientRect();
                    const before =
                      event.clientY < rect.top + rect.height / 2;
                    if (overId !== product.id || overBefore !== before) {
                      setOverId(product.id);
                      setOverBefore(before);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(product.id);
                  }}
                  onDragEnd={endDrag}
                >
                  <TableCell>
                    {reorderable ? (
                      <button
                        type="button"
                        id={`reorder-${product.id}`}
                        aria-label={`Reorder ${product.name}`}
                        title="Drag to reorder, or focus and press ↑ / ↓"
                        onKeyDown={(event) => {
                          const index = rows.findIndex(
                            (row) => row.id === product.id,
                          );
                          if (event.key === "ArrowUp" && index > 0) {
                            event.preventDefault();
                            move(index, index - 1);
                          } else if (
                            event.key === "ArrowDown" &&
                            index < rows.length - 1
                          ) {
                            event.preventDefault();
                            move(index, index + 1);
                          }
                        }}
                        className="grid size-7 cursor-grab place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-meta hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                      >
                        <GripVertical size={15} aria-hidden />
                      </button>
                    ) : null}
                  </TableCell>
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
                      draggable={false}
                      className="font-medium transition-colors underline-offset-2 hover:underline decoration-peach-deep"
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
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          href={`/admin/products/${product.id}`}
                          draggable={false}
                        >
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
    </div>
  );
}
