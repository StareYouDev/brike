"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import {
  deleteCollectionAction,
  reorderCollectionsAction,
} from "@/lib/actions/collections";
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
import type { AdminCollectionListItem } from "@/lib/queries";

const orderKey = (rows: AdminCollectionListItem[]) =>
  rows.map((row) => row.id).join("|");

/**
 * Admin collections table with drag-and-drop reordering (same mechanics as
 * ProductsTable): drops or ↑/↓ on a row's grip persist through
 * `reorderCollectionsAction` as an optimistic slice save; a failed save
 * rolls back to server truth with the inline banner.
 */
export function CollectionsTable({
  items,
  offset,
}: {
  items: AdminCollectionListItem[];
  /** Where this page's rows start in the global sort (pagination slice). */
  offset: number;
}) {
  // Optimistic order: the ids the admin last arranged. Derived against the
  // server's `items` on every render, so revalidations flow through.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const rows = useMemo(() => {
    if (!localOrder) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered: AdminCollectionListItem[] = [];
    for (const id of localOrder) {
      const item = byId.get(id);
      if (item) {
        ordered.push(item);
        byId.delete(id);
      }
    }
    // Collections that appeared after this arrangement keep their slot.
    for (const item of items) {
      if (byId.has(item.id)) ordered.push(item);
    }
    return ordered;
  }, [items, localOrder]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overBefore, setOverBefore] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const persist = (next: AdminCollectionListItem[]) => {
    if (orderKey(next) === orderKey(rows)) return;
    const ids = next.map((row) => row.id);
    setLocalOrder(ids);
    setSaveError(null);
    startTransition(async () => {
      let error: string | undefined;
      try {
        error = (await reorderCollectionsAction(ids, offset)).error;
      } catch {
        error = "Saving the order failed. Please try again.";
      }
      if (error) {
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
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Reorder</span>
              </TableHead>
              <TableHead className="w-16">Banner</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Short label</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-16 text-right">Sort</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((collection) => {
              const isDragging = dragId === collection.id;
              const isOver = overId === collection.id;
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
                  key={collection.id}
                  className={rowClassName}
                  draggable={!isPending}
                  onDragStart={(event) => {
                    setDragId(collection.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", collection.id);
                  }}
                  onDragOver={(event) => {
                    if (!dragId || dragId === collection.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    const rect = event.currentTarget.getBoundingClientRect();
                    const before =
                      event.clientY < rect.top + rect.height / 2;
                    if (overId !== collection.id || overBefore !== before) {
                      setOverId(collection.id);
                      setOverBefore(before);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(collection.id);
                  }}
                  onDragEnd={endDrag}
                >
                  <TableCell>
                    <button
                      type="button"
                      id={`reorder-${collection.id}`}
                      aria-label={`Reorder ${collection.title}`}
                      title="Drag to reorder, or focus and press ↑ / ↓"
                      onKeyDown={(event) => {
                        const index = rows.findIndex(
                          (row) => row.id === collection.id,
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
                  </TableCell>
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
                      className="font-medium transition-colors underline-offset-2 hover:underline decoration-peach-deep"
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
