"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  isDuplicateKeyError,
  parseUuid,
  requireAdmin,
  type ActionState,
} from "@/lib/admin-auth";
import { BADGES, PALETTE_NAMES, PATTERN_TYPES } from "@/lib/admin-form";
import { getDb } from "@/lib/db";
import { productCollections, products } from "@/lib/db/schema";
import { removeImage, uploadImage } from "@/lib/uploads";

const lines = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** Shared £ → integer pence parsing (null only when optional and empty). */
function toPence(
  value: string,
  ctx: z.RefinementCtx,
  required: boolean,
): number | null {
  const v = value.trim();
  if (!v) {
    if (required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required.",
      });
      return z.NEVER;
    }
    return null;
  }
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(v)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use pounds, e.g. 24.99",
    });
    return z.NEVER;
  }
  const pence = Math.round(parseFloat(v) * 100);
  if (pence <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must be above 0.",
    });
    return z.NEVER;
  }
  return pence;
}

/** Required price — typed as a non-null integer pence value. */
const requiredMoney = z
  .string()
  .transform((value, ctx) => toPence(value, ctx, true) as number);

/** Optional price — null when cleared. */
const optionalMoney = z
  .string()
  .transform((value, ctx) => toPence(value, ctx, false));

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

/** Image reference: site path (/prints/…) or https URL — never javascript:. */
const imageRef = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || v.startsWith("/") || v.startsWith("https://"),
    "Must start with / or https://",
  );

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short.").max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Lowercase letters, numbers and hyphens only.",
      ),
    price: requiredMoney,
    compareAt: optionalMoney,
    badge: z.enum(BADGES),
    style: z.string().trim().min(1, "Required.").max(200),
    fabric: z.string().trim().min(1, "Required.").max(200),
    description: z
      .string()
      .trim()
      .min(10, "Write at least a sentence.")
      .max(4000),
    details: z
      .array(z.string().trim().min(1))
      .min(1, "Add at least one detail line."),
    colorways: z
      .array(z.string().trim().min(1))
      .min(1, "Add at least one colorway."),
    sizes: z.array(z.string().trim().min(1)).min(1, "Pick at least one size."),
    printType: z.enum(PATTERN_TYPES),
    printA: z.enum(PALETTE_NAMES),
    printB: z.enum(PALETTE_NAMES),
    collectionIds: z
      .array(z.string())
      .min(1, "Pick at least one collection."),
    rating: z.string().transform((value, ctx) => {
      const v = value.trim();
      if (v === "") return 0;
      if (!/^\d(\.\d)?$/.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "0 to 5, e.g. 4.5",
        });
        return z.NEVER;
      }
      const n = parseFloat(v);
      if (n < 0 || n > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be between 0 and 5.",
        });
        return z.NEVER;
      }
      return n;
    }),
    reviews: intIn(0, 999999),
    sortOrder: intIn(-9999, 9999),
    featured: z.boolean(),
    imageA: imageRef,
    imageB: imageRef,
  })
  .transform((d) => ({ ...d, badge: d.badge === "" ? null : d.badge }));

type ParsedProduct = z.infer<typeof productSchema>;

function buildProductInput(formData: FormData): unknown {
  const sizes = [
    ...formData.getAll("sizes").map(String),
    ...String(formData.get("sizesCustom") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  return {
    ...Object.fromEntries(formData.entries()),
    imageA: String(formData.get("imageAPath") ?? ""),
    imageB: String(formData.get("imageBPath") ?? ""),
    featured: formData.get("featured") === "on",
    details: lines(String(formData.get("details") ?? "")),
    colorways: lines(String(formData.get("colorways") ?? "")),
    sizes,
    collectionIds: formData.getAll("collectionIds").map(String),
  };
}

function pickFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function uploadSlot(
  formData: FormData,
  key: "imageA" | "imageB",
  uploaded: string[],
): Promise<string | null> {
  const url = await uploadImage(pickFile(formData, key), "products");
  if (url) uploaded.push(url);
  return url;
}

function validationState(error: z.ZodError): ActionState {
  return { fieldErrors: error.flatten().fieldErrors };
}

function dbValues(d: ParsedProduct, imageA: string | null, imageB: string | null) {
  return {
    slug: d.slug,
    name: d.name,
    pricePence: d.price,
    compareAtPence: d.compareAt,
    badge: d.badge,
    style: d.style,
    fabric: d.fabric,
    description: d.description,
    details: d.details,
    colorways: d.colorways,
    sizes: d.sizes,
    printType: d.printType,
    printA: d.printA,
    printB: d.printB,
    imageA,
    imageB,
    rating: d.rating,
    reviews: d.reviews,
    featured: d.featured,
    sortOrder: d.sortOrder,
  };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse(buildProductInput(formData));
  if (!parsed.success) return validationState(parsed.error);
  const d = parsed.data;

  // Validate + store uploads server-side before touching the database.
  const uploaded: string[] = [];
  try {
    const uploadA = await uploadSlot(formData, "imageA", uploaded);
    const uploadB = await uploadSlot(formData, "imageB", uploaded);

    const db = await getDb();
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(products)
        .values(
          dbValues(
            d,
            uploadA ?? (d.imageA || null),
            uploadB ?? (d.imageB || null),
          ),
        )
        .returning({ id: products.id });
      if (d.collectionIds.length > 0) {
        await tx.insert(productCollections).values(
          d.collectionIds.map((collectionId) => ({
            productId: row.id,
            collectionId,
          })),
        );
      }
    });
  } catch (error) {
    await Promise.all(uploaded.map(removeImage)); // no orphan blobs on failure
    if (isDuplicateKeyError(error)) {
      return { fieldErrors: { slug: ["That slug is already in use."] } };
    }
    console.error("[admin] create product failed:", error);
    return { error: "Saving the product failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!parseUuid(id)) return { error: "Unknown product." };

  const parsed = productSchema.safeParse(buildProductInput(formData));
  if (!parsed.success) return validationState(parsed.error);
  const d = parsed.data;

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!existing) return { error: "That product no longer exists." };

  const uploaded: string[] = [];
  try {
    const uploadA = await uploadSlot(formData, "imageA", uploaded);
    const uploadB = await uploadSlot(formData, "imageB", uploaded);
    const nextImageA = uploadA ?? (d.imageA || null);
    const nextImageB = uploadB ?? (d.imageB || null);

    await db
      .update(products)
      .set({
        ...dbValues(d, nextImageA, nextImageB),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Swap collection links.
    await db
      .delete(productCollections)
      .where(eq(productCollections.productId, id));
    if (d.collectionIds.length > 0) {
      await db.insert(productCollections).values(
        d.collectionIds.map((collectionId) => ({
          productId: id,
          collectionId,
        })),
      );
    }

    // Clean up replaced/removed blob images (best-effort, post-commit).
    if (existing.imageA && existing.imageA !== nextImageA) {
      await removeImage(existing.imageA);
    }
    if (existing.imageB && existing.imageB !== nextImageB) {
      await removeImage(existing.imageB);
    }
  } catch (error) {
    await Promise.all(uploaded.map(removeImage));
    if (isDuplicateKeyError(error)) {
      return { fieldErrors: { slug: ["That slug is already in use."] } };
    }
    console.error("[admin] update product failed:", error);
    return { error: "Saving the product failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  if (!parseUuid(id)) return;

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!existing) return;

  await db.delete(products).where(eq(products.id, id)); // links cascade
  await Promise.all(
    [existing.imageA, existing.imageB]
      .filter((url): url is string => Boolean(url))
      .map(removeImage),
  );
  revalidatePath("/", "layout");
}
