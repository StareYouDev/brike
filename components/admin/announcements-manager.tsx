"use client";

import { useActionState } from "react";
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

function AnnouncementRow({
  item,
  updateAction,
  deleteAction,
}: {
  item: AdminAnnouncement;
  updateAction: (
    id: string,
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [state, formAction] = useActionState(
    updateAction.bind(null, item.id),
    {},
  );

  return (
    // The row's update form and DeleteButton's confirm form must be SIBLINGS:
    // nested <form>s are invalid HTML — the parser drops the inner tag and the
    // confirm button would submit the update action instead of deleting.
    <div
      data-testid="announcement-row"
      className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 last:border-b-0"
    >
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

/**
 * Marquee announcements: add row on top, editable rows below. Each row is its
 * own useActionState form so one failing row never disturbs the others.
 */
export function AnnouncementsManager({
  items,
  createAction,
  updateAction,
  deleteAction,
}: {
  items: AdminAnnouncement[];
  createAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  updateAction: (
    id: string,
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <AddRow action={createAction} />

      <section
        aria-label="Announcements"
        className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
      >
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-muted-foreground">
            No announcements yet — the marquee bar stays hidden until one
            exists.
          </p>
        ) : (
          items.map((item) => (
            <AnnouncementRow
              key={item.id}
              item={item}
              updateAction={updateAction}
              deleteAction={deleteAction}
            />
          ))
        )}
      </section>
    </div>
  );
}
