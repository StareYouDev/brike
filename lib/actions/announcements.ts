"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { requireAdmin, type ActionState } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { announcements } from "@/lib/db/schema";

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
    .orderBy(asc(announcements.sortOrder));
  return rows.map((r) => r.id);
}
