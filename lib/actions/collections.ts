"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  isDuplicateKeyError,
  parseUuid,
  requireAdmin,
  type ActionState,
} from "@/lib/admin-auth";
import { PALETTE_NAMES, PATTERN_TYPES } from "@/lib/admin-form";
import { getDb } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { removeImage, uploadImage } from "@/lib/uploads";

const intIn = (min: number, max: number) =>
  z.string().transform((value, ctx) => {
    if (!/^-?\d{1,6}$/.test(value.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Whole number only.",
      });
      return z.NEVER;
    }
    const n = parseInt(value.trim(), 10);
    if (n < min || n > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must be between ${min} and ${max}.`,
      });
      return z.NEVER;
    }
    return n;
  });

const collectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers and hyphens only.",
    ),
  title: z.string().trim().min(2, "Title is too short.").max(120),
  shortTitle: z.string().trim().min(1, "Required.").max(40),
  description: z
    .string()
    .trim()
    .min(10, "Write at least a sentence.")
    .max(1000),
  printType: z.enum(PATTERN_TYPES),
  printA: z.enum(PALETTE_NAMES),
  printB: z.enum(PALETTE_NAMES),
  sortOrder: intIn(-9999, 9999),
  image: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || v.startsWith("/") || v.startsWith("https://"),
      "Must start with / or https://",
    ),
});

function buildCollectionInput(formData: FormData): unknown {
  return {
    ...Object.fromEntries(
      [...formData.entries()].filter(([key]) => key !== "image"),
    ),
    image: String(formData.get("imagePath") ?? ""),
  };
}

function validationState(error: z.ZodError): ActionState {
  return { fieldErrors: error.flatten().fieldErrors };
}

export async function createCollectionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = collectionSchema.safeParse(buildCollectionInput(formData));
  if (!parsed.success) return validationState(parsed.error);
  const d = parsed.data;

  const uploaded: string[] = [];
  try {
    const file = formData.get("image");
    const upload =
      file instanceof File && file.size > 0
        ? await uploadImage(file, "collections")
        : null;
    if (upload) uploaded.push(upload);

    const db = await getDb();
    await db.insert(collections).values({
      slug: d.slug,
      title: d.title,
      shortTitle: d.shortTitle,
      description: d.description,
      image: upload ?? (d.image || null),
      printType: d.printType,
      printA: d.printA,
      printB: d.printB,
      sortOrder: d.sortOrder,
    });
  } catch (error) {
    await Promise.all(uploaded.map(removeImage));
    if (isDuplicateKeyError(error)) {
      return { fieldErrors: { slug: ["That slug is already in use."] } };
    }
    console.error("[admin] create collection failed:", error);
    return { error: "Saving the collection failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/collections");
}

export async function updateCollectionAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!parseUuid(id)) return { error: "Unknown collection." };

  const parsed = collectionSchema.safeParse(buildCollectionInput(formData));
  if (!parsed.success) return validationState(parsed.error);
  const d = parsed.data;

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (!existing) return { error: "That collection no longer exists." };

  const uploaded: string[] = [];
  try {
    const file = formData.get("image");
    const upload =
      file instanceof File && file.size > 0
        ? await uploadImage(file, "collections")
        : null;
    if (upload) uploaded.push(upload);
    const nextImage = upload ?? (d.image || null);

    await db
      .update(collections)
      .set({
        slug: d.slug,
        title: d.title,
        shortTitle: d.shortTitle,
        description: d.description,
        image: nextImage,
        printType: d.printType,
        printA: d.printA,
        printB: d.printB,
        sortOrder: d.sortOrder,
      })
      .where(eq(collections.id, id));

    if (existing.image && existing.image !== nextImage) {
      await removeImage(existing.image);
    }
  } catch (error) {
    await Promise.all(uploaded.map(removeImage));
    if (isDuplicateKeyError(error)) {
      return { fieldErrors: { slug: ["That slug is already in use."] } };
    }
    console.error("[admin] update collection failed:", error);
    return { error: "Saving the collection failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/collections");
}

export async function deleteCollectionAction(id: string): Promise<void> {
  await requireAdmin();
  if (!parseUuid(id)) return;

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (!existing) return;

  // Products keep existing: product_collections links cascade with the row.
  await db.delete(collections).where(eq(collections.id, id));
  if (existing.image) await removeImage(existing.image);
  revalidatePath("/", "layout");
}

/**
 * Persist a drag-and-drop reorder of the visible *slice* of the collections
 * list (mirrors reorderProductsAction): `ids` is the page's ids in order,
 * `offset` where the page starts globally. The slice's *membership* must
 * match the server's current order — order is exactly what this call
 * changes, but a collection added/removed elsewhere since the render makes
 * the sets differ, so we reject with the "list changed" error the UI rolls
 * back on instead of scrambling the mega menu.
 */
export async function reorderCollectionsAction(
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
    return { error: "That collection order isn't valid." };
  }

  const db = await getDb();
  try {
    const existing = await db
      .select({ id: collections.id })
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.title));
    const current = existing.map((row) => row.id);
    const slice = current.slice(offset, offset + ids.length);
    const sliceIds = new Set(slice);
    if (slice.length !== ids.length || !ids.every((id) => sliceIds.has(id))) {
      return {
        error: "The collection list changed elsewhere — reload and try again.",
      };
    }
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(collections)
          .set({ sortOrder: offset + index })
          .where(eq(collections.id, id));
      }
    });
  } catch (error) {
    console.error("[admin] reorder collections failed:", error);
    return { error: "Saving the order failed. Please try again." };
  }

  revalidatePath("/", "layout");
  return {};
}
