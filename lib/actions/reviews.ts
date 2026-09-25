"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { type ActionState } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { overQuota, REVIEW_QUOTA } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

/**
 * Public PDP review submission (stars + comment). Unauthenticated, so like
 * the order action it never trusts the payload: zod shape/length checks, a
 * product-existence check by slug, and a fixed-window per-IP quota so one
 * connection can't flood the table. The limiter fails open (a throttle fault
 * must never block a real customer — the insert is the real failure point).
 */
const reviewSchema = z.object({
  slug: z.string().trim().min(2).max(140),
  author: z.string().trim().min(2, "Please tell us your name.").max(50),
  rating: z.string().regex(/^[1-5]$/, "Pick a star rating."),
  body: z
    .string()
    .trim()
    .min(10, "A few words at least — 10 characters minimum.")
    .max(1000, "Keep it under 1000 characters."),
});

export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    slug: formData.get("slug"),
    author: formData.get("author"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { slug, author, rating, body } = parsed.data;

  const db = await getDb();
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!product) {
    return { error: "That product isn't available right now." };
  }

  try {
    const ip = await clientIp();
    if (
      await overQuota(
        `review:ip:${ip ?? "unknown"}`,
        REVIEW_QUOTA.ip.limit,
        REVIEW_QUOTA.ip.windowSec,
      )
    ) {
      return {
        error: "You've posted a few reviews recently — please wait a little while and try again.",
      };
    }
  } catch (error) {
    console.error("[rate-limit] review quota check failed:", error);
  }

  await db.insert(reviews).values({
    productId: product.id,
    author,
    rating: Number(rating),
    body,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
