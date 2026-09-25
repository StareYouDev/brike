"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { GripVertical } from "lucide-react";
import { reorderAnnouncementsAction } from "@/lib/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/admin-auth";
import type { AdminAnnouncement } from "@/lib/queries";
import { DeleteButton } from "@/components/admin/delete-button";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-[12px] text-destructive">{messages[0]}</p>;
}

function AddRow({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <div className="min-w-60 flex-1 space-y-1.5">
        <Label htmlFor="announcement-new">New announcement</Label>
        <Input
          id="announcement-new"
          name="text"
          maxLength={160}
          placeholder="Free UK delivery over £60…"
        />
        <FieldError messages={state.fieldErrors?.text} />
      </div>
      <Button type="submit">Add announcement</Button>
      {state.error ? (
        <p role="alert" className="w-full text-[12.5px] text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/** Drag/keyboard handlers the manager binds per row. */
interface AnnouncementDnd {
  isDragging: boolean;
  isOver: boolean;
  overBefore: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function AnnouncementRow({
  item,
  updateAction,
  deleteAction,
  dnd,
}: {
  item: AdminAnnouncement;
  updateAction: (
    id: string,
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
  dnd: AnnouncementDnd;
}) {
  const [state, formAction] = useActionState(
    updateAction.bind(null, item.id),
    {},
  );

  const rowClassName = [
    "flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 last:border-b-0",
    dnd.isDragging && "opacity-40",
    dnd.isOver &&
      "bg-peach/10 " +
        (dnd.overBefore
          ? "shadow-[inset_0_3px_0_0_var(--color-peach-deep)]"
          : "shadow-[inset_0_-3px_0_0_var(--color-peach-deep)]"),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // The row's update form and DeleteButton's confirm form must be SIBLINGS:
    // nested <form>s are invalid HTML — the parser drops the inner tag and the
    // confirm button would submit the update action instead of deleting.
    <div
      data-testid="announcement-row"
      draggable
      onDragStart={dnd.onDragStart}
      onDragOver={dnd.onDragOver}
      onDrop={dnd.onDrop}
      onDragEnd={dnd.onDragEnd}
      className={rowClassName}
    >
      <button
        type="button"
        id={`reorder-${item.id}`}
        aria-label={`Reorder ${item.text}`}
        title="Drag to reorder, or focus and press ↑ / ↓"
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            dnd.onMoveUp();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            dnd.onMoveDown();
          }
        }}
        className="grid size-7 cursor-grab place-items-center self-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-meta hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical size={15} aria-hidden />
      </button>
      <form action={formAction} className="flex min-w-60 flex-[2] flex-wrap items-end gap-3">
        <div className="min-w-60 flex-[2] space-y-1.5">
          <Label htmlFor={`announcement-${item.id}`} className="sr-only">
            Announcement text
          </Label>
          <Input
            id={`announcement-${item.id}`}
            name="text"
            maxLength={160}
            defaultValue={item.text}
          />
          <FieldError messages={state.fieldErrors?.text} />
        </div>
        <div className="w-24 space-y-1.5">
          <Label
            htmlFor={`announcement-sort-${item.id}`}
            className="text-[11.5px] text-muted-foreground"
          >
            Order
          </Label>
          <Input
            id={`announcement-sort-${item.id}`}
            name="sortOrder"
            type="number"
            min={0}
            className="tabular-nums"
            defaultValue={item.sortOrder}
          />
          <FieldError messages={state.fieldErrors?.sortOrder} />
        </div>
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
        {state.ok ? (
          <span className="text-[12px] font-medium text-forest">Saved ✓</span>
        ) : null}
        {state.error ? (
          <p role="alert" className="w-full text-[12.5px] text-destructive">
            {state.error}
          </p>
        ) : null}
      </form>
      <div className="ml-auto">
        <DeleteButton
          action={deleteAction.bind(null, item.id)}
          subject="this announcement"
        />
      </div>
    </div>
  );
}

const orderKey = (rows: AdminAnnouncement[]) =>
  rows.map((row) => row.id).join("|");

/**
 * Marquee announcements: add row on top, editable rows below — each row is
 * its own useActionState form so one failing row never disturbs the others.
 * Rows drag (or ↑/↓ on the grip) and persist through a slice reorder save;
 * a failed save rolls back to server truth with the inline banner.
 */
export function AnnouncementsManager({
  items,
  offset,
  createAction,
  updateAction,
  deleteAction,
}: {
  items: AdminAnnouncement[];
  /** Where this page's rows start in the global sort (pagination slice). */
  offset: number;
  createAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  updateAction: (
    id: string,
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
}) {
  // Optimistic order: the ids the admin last arranged, derived against the
  // server's `items` so revalidations (adds, deletes) flow through.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const rows = useMemo(() => {
    if (!localOrder) return items;
    const byId = new Map(items.map((item) => [item.id, item]));
    const ordered: AdminAnnouncement[] = [];
    for (const id of localOrder) {
      const item = byId.get(id);
      if (item) {
        ordered.push(item);
        byId.delete(id);
      }
    }
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

  const persist = (next: AdminAnnouncement[]) => {
    if (orderKey(next) === orderKey(rows)) return;
    const ids = next.map((row) => row.id);
    setLocalOrder(ids);
    setSaveError(null);
    startTransition(async () => {
      let error: string | undefined;
      try {
        error = (await reorderAnnouncementsAction(ids, offset)).error;
      } catch {
        error = "Saving the order failed. Please try again.";
      }
      if (error) {
        setSaveError(error);
        setLocalOrder(null);
      }
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= rows.length) return;
    const id = rows[index].id;
    const next = rows.slice();
    const [moved] = next.splice(index, 1);
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
    <div className="space-y-5">
      <AddRow action={createAction} />

      <div aria-live="polite" className="min-h-5 text-[13px]">
        {status}
      </div>

      <section
        aria-label="Announcements"
        className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
      >
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-muted-foreground">
            No announcements yet — the marquee bar stays hidden until one
            exists.
          </p>
        ) : (
          rows.map((item, index) => (
            <AnnouncementRow
              key={item.id}
              item={item}
              updateAction={updateAction}
              deleteAction={deleteAction}
              dnd={{
                isDragging: dragId === item.id,
                isOver: overId === item.id,
                overBefore,
                onDragStart: (event) => {
                  setDragId(item.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                },
                onDragOver: (event) => {
                  if (!dragId || dragId === item.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  const rect = event.currentTarget.getBoundingClientRect();
                  const before =
                    event.clientY < rect.top + rect.height / 2;
                  if (overId !== item.id || overBefore !== before) {
                    setOverId(item.id);
                    setOverBefore(before);
                  }
                },
                onDrop: (event) => {
                  event.preventDefault();
                  dropOn(item.id);
                },
                onDragEnd: endDrag,
                onMoveUp: () => move(index, -1),
                onMoveDown: () => move(index, 1),
              }}
            />
          ))
        )}
      </section>
    </div>
  );
}
