"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { parseUuid, requireAdmin, type ActionState } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { announcements } from "@/lib/db/schema";

/** Same order as the list queries — id breaks ties between equal sorts. */
const byDisplayOrder = [asc(announcements.sortOrder), asc(announcements.id)];

function readText(formData: FormData): string | ActionState {
  const text = String(formData.get("text") ?? "").trim();
  if (text.length < 3) {
    return { fieldErrors: { text: ["Announcement is too short."] } };
  }
  if (text.length > 160) {
    return { fieldErrors: { text: ["Keep it under 160 characters."] } };
  }
  return text;
}

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = readText(formData);
  if (typeof parsed !== "string") return parsed;

  const db = await getDb();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${announcements.sortOrder}), -1)` })
    .from(announcements);

  await db
    .insert(announcements)
    .values({ text: parsed, sortOrder: Number(max) + 1 });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAnnouncementAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = readText(formData);
  if (typeof parsed !== "string") return parsed;

  const sortRaw = String(formData.get("sortOrder") ?? "0").trim();
  const sortOrder = /^\d{1,4}$/.test(sortRaw)
    ? parseInt(sortRaw, 10)
    : null;
  if (sortOrder === null) {
    return { fieldErrors: { sortOrder: ["Whole number only."] } };
  }

  const db = await getDb();
  const [row] = await db
    .select({ id: announcements.id })
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);
  if (!row) return { error: "That announcement no longer exists." };

  await db
    .update(announcements)
    .set({ text: parsed, sortOrder })
    .where(eq(announcements.id, id));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath("/", "layout");
}

/** Sort order helper used by the manager to place new rows last. */
export async function listAnnouncementOrder(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: announcements.id })
    .from(announcements)
    .orderBy(...byDisplayOrder);
  return rows.map((r) => r.id);
}

/**
 * Persist a drag-and-drop reorder of the visible *slice* of the list
 * (mirrors reorderProductsAction): `ids` is the page's ids in order,
 * `offset` where the page starts globally. The slice's *membership* must
 * match the server's current order — order is exactly what this call
 * changes, but an announcement added/removed elsewhere since the render
 * makes the sets differ, so we reject with the "list changed" error the UI
 * rolls back on rather than scrambling the marquee.
 */
export async function reorderAnnouncementsAction(
  ids: string[],
  offset: number,
): Promise<ActionState> {
  await requireAdmin();
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 100 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => typeof id !== "string" || !parseUuid(id))
  ) {
    return { error: "That order isn't valid." };
  }

  const db = await getDb();
  try {
    const existing = await db
      .select({ id: announcements.id })
      .from(announcements)
      .orderBy(...byDisplayOrder);
    const current = existing.map((row) => row.id);
    const slice = current.slice(offset, offset + ids.length);
    const sliceIds = new Set(slice);
    if (slice.length !== ids.length || !ids.every((id) => sliceIds.has(id))) {
      return {
        error: "The list changed elsewhere — reload and try again.",
      };
    }
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(announcements)
          .set({ sortOrder: offset + index })
          .where(eq(announcements.id, id));
      }
    });
  } catch (error) {
    console.error("[admin] reorder announcements failed:", error);
    return { error: "Saving the order failed. Please try again." };
  }

  revalidatePath("/", "layout");
  return {};
}
