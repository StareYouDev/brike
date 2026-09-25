"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, type ActionState } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import type { FormKey } from "@/lib/form-settings";

/**
 * Saves one form's copy (contact / checkout) as a JSON settings row. Admin
 * only, zod-validated against the same shapes the storefront renders; the
 * layout revalidation refreshes the statically prerendered pages on the
 * next visit.
 */
const linesTo = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) =>
      String(value ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    z.array(z.string().min(1).max(40)).min(min, message).max(max, "Too many."),
  );

const contactSchema = z.object({
  heading: z.string().trim().min(2, "Heading is too short.").max(120),
  intro: z.string().trim().min(10, "Write at least a sentence.").max(400),
  subjects: linesTo(1, 8, "Add at least one subject."),
  submitLabel: z.string().trim().min(1, "Required.").max(40),
  note: z.string().trim().max(240, "Keep it under 240 characters."),
  successTitle: z.string().trim().min(2, "Too short.").max(80),
  successBody: z.string().trim().min(10, "Write at least a sentence.").max(400),
});

const checkoutSchema = z.object({
  eyebrow: z.string().trim().min(1, "Required.").max(40),
  heading: z.string().trim().min(2, "Heading is too short.").max(60),
  intro: z.string().trim().min(10, "Write at least a sentence.").max(400),
  detailsHeading: z.string().trim().min(1, "Required.").max(60),
  detailsNote: z.string().trim().min(10, "Write at least a sentence.").max(300),
  basketHeading: z.string().trim().min(1, "Required.").max(60),
  payNoteHeading: z.string().trim().min(1, "Required.").max(60),
  payNoteBody: z.string().trim().min(10, "Write at least a sentence.").max(400),
  submitLabel: z.string().trim().min(1, "Required.").max(40),
  footnote: z.string().trim().min(1, "Required.").max(240),
});

export async function saveFormSettingsAction(
  key: FormKey,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed =
    key === "contact"
      ? contactSchema.safeParse(raw)
      : checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const db = await getDb();
  await db
    .insert(settings)
    .values({ key: `form:${key}`, value: parsed.data })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed.data, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
  return { ok: true };
}
