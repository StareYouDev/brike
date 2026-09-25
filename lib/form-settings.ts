import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import {
  DEFAULT_CHECKOUT_COPY,
  DEFAULT_CONTACT_COPY,
  type CheckoutFormCopy,
  type ContactFormCopy,
} from "@/lib/form-copy";

/** Which editable form a settings row belongs to. */
export type FormKey = "contact" | "checkout";

const settingsKey = (key: FormKey) => `form:${key}`;

/**
 * Merges a stored row over the defaults, whitelisting known keys and types
 * (a hand-edited or stale row can never inject stray fields into the UI).
 */
function sanitizeContact(stored: unknown): ContactFormCopy {
  const out = { ...DEFAULT_CONTACT_COPY };
  if (typeof stored !== "object" || stored === null) return out;
  const row = stored as Record<string, unknown>;
  for (const field of [
    "heading",
    "intro",
    "submitLabel",
    "note",
    "successTitle",
    "successBody",
  ] as const) {
    const value = row[field];
    if (typeof value === "string" && value.trim() !== "") {
      out[field] = value;
    }
  }
  if (Array.isArray(row.subjects)) {
    const subjects = row.subjects.filter(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );
    if (subjects.length > 0) out.subjects = subjects;
  }
  return out;
}

function sanitizeCheckout(stored: unknown): CheckoutFormCopy {
  const out = { ...DEFAULT_CHECKOUT_COPY };
  if (typeof stored !== "object" || stored === null) return out;
  const row = stored as Record<string, unknown>;
  for (const field of [
    "eyebrow",
    "heading",
    "intro",
    "detailsHeading",
    "detailsNote",
    "basketHeading",
    "payNoteHeading",
    "payNoteBody",
    "submitLabel",
    "footnote",
  ] as const) {
    const value = row[field];
    if (typeof value === "string" && value.trim() !== "") {
      out[field] = value;
    }
  }
  return out;
}

/**
 * Form copy for a storefront page: the admin's saved wording, falling back
 * to the defaults until something has been saved. Reads the settings table
 * (empty until first save — no seed required).
 */
export async function getFormSettings(
  key: "contact",
): Promise<ContactFormCopy>;
export async function getFormSettings(
  key: "checkout",
): Promise<CheckoutFormCopy>;
export async function getFormSettings(
  key: FormKey,
): Promise<ContactFormCopy | CheckoutFormCopy> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, settingsKey(key)))
    .limit(1);
  return key === "contact"
    ? sanitizeContact(row?.value)
    : sanitizeCheckout(row?.value);
}
