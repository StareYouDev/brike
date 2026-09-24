"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { isDuplicateKeyError, type ActionState } from "@/lib/admin-auth";
import { deliveryPenceFor, newOrderCode } from "@/lib/checkout";
import { getDb } from "@/lib/db";
import { orderItems, orders, products } from "@/lib/db/schema";
import { productImages } from "@/lib/images";
import { orderQuotaError } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

/**
 * Public order placement (cash on delivery only — no payment is ever taken).
 *
 * Security (securly): this is an UNAUTHENTICATED mutation, so the server
 * never trusts the client's basket beyond {slug,size,colorway,qty} — prices,
 * names and images are re-read from the database, sizes/colourways are
 * re-validated against the live catalog, quantities are clamped to the same
 * 1–10 range the cart enforces, and every total is recomputed in integer
 * pence inside one transaction. A honeypot field sheds naive bots, and
 * Phase 5 added fixed-window quotas (per email, per IP) in lib/rate-limit.ts
 * so one connection can't flood the orders table.
 */

const basketLine = z.object({
  slug: z.string().min(2).max(140),
  size: z.string().min(1).max(20),
  colorway: z.string().min(1).max(80),
  qty: z.number().int().min(1).max(10),
});

const contact = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number."),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200),
  city: z.string().trim().min(2).max(100),
  postcode: z
    .string()
    .trim()
    .regex(
      /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
      "Enter a valid UK postcode.",
    ),
  notes: z.string().trim().max(500),
});

export async function placeOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Honeypot: humans never see (or fill) this field. Fail like a no-op so
  // bots learn nothing from the response.
  if (String(formData.get("website") ?? "").trim() !== "") return {};

  const fields = contact.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address1: String(formData.get("address1") ?? ""),
    address2: String(formData.get("address2") ?? ""),
    city: String(formData.get("city") ?? ""),
    postcode: String(formData.get("postcode") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!fields.success) {
    return { fieldErrors: fields.error.flatten().fieldErrors };
  }

  let rawBasket: unknown;
  try {
    rawBasket = JSON.parse(String(formData.get("basket") ?? ""));
  } catch {
    return {
      error: "We couldn't read your basket — refresh the page and try again.",
    };
  }
  const parsedBasket = z.array(basketLine).min(1).max(20).safeParse(rawBasket);
  if (!parsedBasket.success) {
    return {
      error: "Your basket is empty or out of date — refresh the page and try again.",
    };
  }
  const basket = parsedBasket.data;

  // Quota after validation so only well-formed requests consume it; blocked
  // clients never reach the catalog queries below.
  const quotaError = await orderQuotaError(fields.data.email, await clientIp());
  if (quotaError) return { error: quotaError };

  const db = await getDb();
  const slugs = [...new Set(basket.map((line) => line.slug))];
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.slug, slugs));
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  for (const line of basket) {
    const product = bySlug.get(line.slug);
    if (!product) {
      return {
        error: "One of the items in your basket is no longer available.",
      };
    }
    if (!product.sizes.includes(line.size)) {
      return { error: `${product.name} isn't available in size ${line.size}.` };
    }
    if (!product.colorways.includes(line.colorway)) {
      return {
        error: `${product.name} has no colourway called ${line.colorway}.`,
      };
    }
  }

  // Snapshot lines for order_items — mirrors how AddToCart picks a variant
  // image (first colourway → art A, others → art B).
  const items = basket.map((line) => {
    const product = bySlug.get(line.slug)!;
    const images = productImages({
      slug: product.slug,
      imageA: product.imageA ?? undefined,
      imageB: product.imageB ?? undefined,
    });
    const colorwayIndex = product.colorways.indexOf(line.colorway);
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: line.size,
      colorway: line.colorway,
      qty: line.qty,
      unitPricePence: product.pricePence,
      image: colorwayIndex <= 0 ? images.a : images.b,
    };
  });

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.qty,
    0,
  );
  const deliveryPence = deliveryPenceFor(subtotalPence);
  const totalPence = subtotalPence + deliveryPence;

  const order = {
    status: "pending",
    paymentMethod: "cod",
    email: fields.data.email,
    name: fields.data.name,
    phone: fields.data.phone,
    address1: fields.data.address1,
    address2: fields.data.address2 || null,
    city: fields.data.city,
    postcode: fields.data.postcode.toUpperCase(),
    country: "United Kingdom",
    notes: fields.data.notes || null,
    subtotalPence,
    deliveryPence,
    totalPence,
  };

  let orderCode = "";
  let placed = false;
  for (let attempt = 0; attempt < 3 && !placed; attempt++) {
    orderCode = newOrderCode();
    try {
      await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(orders)
          .values({ code: orderCode, ...order })
          .returning({ id: orders.id });
        await tx
          .insert(orderItems)
          .values(items.map((item) => ({ ...item, orderId: row.id })));
      });
      placed = true;
    } catch (error) {
      // A code collision is astronomically unlikely but retried with a fresh
      // code; anything else surfaces to the customer as a retryable error.
      if (!(attempt < 2 && isDuplicateKeyError(error))) {
        console.error("[checkout] place order failed:", error);
        return { error: "We couldn't place your order — please try again." };
      }
    }
  }
  if (!placed) {
    return { error: "We couldn't place your order — please try again." };
  }

  // Outside every catch: redirect() throws NEXT_REDIRECT, which must escape.
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${orderCode}`);
}
