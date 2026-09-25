"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizeColorways } from "@/data/catalog";
import { isDuplicateKeyError, type ActionState } from "@/lib/admin-auth";
import { deliveryPenceFor, newOrderCode } from "@/lib/checkout";
import {
  newOrderAlertEmail,
  orderConfirmationEmail,
  sendEmail,
} from "@/lib/email";
import { getDb } from "@/lib/db";
import {
  orderItems,
  orders,
  products,
  productStock,
} from "@/lib/db/schema";
import {
  claimDiscount,
  discountPenceFor,
  resolveDiscount,
} from "@/lib/discount";
import { productImages } from "@/lib/images";
import { DISCOUNT_QUOTA, orderQuotaError, overQuota } from "@/lib/rate-limit";
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

/**
 * Raised inside the checkout transaction when a guarded stock decrement
 * finds the last unit already claimed by a concurrent checkout. The whole
 * order rolls back; the friendly message is surfaced to the customer.
 * Module-local on purpose — "use server" files may only export async
 * functions.
 */
class InsufficientStockError extends Error {}

/**
 * Raised inside the checkout transaction when the guarded redemption loses
 * a race (code deactivated, cap reached, or this email already redeemed it).
 * Module-local for the same "use server" export reason as above.
 */
class DiscountError extends Error {}

/** User-facing stock rejection: sold out vs. not enough for the quantity. */
function stockError(name: string, size: string, available: number): string {
  return available === 0
    ? `${name} in size ${size} is sold out.`
    : `Only ${available} left of ${name} (size ${size}).`;
}

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

export interface DiscountPreviewState {
  ok?: boolean;
  error?: string;
  code?: string;
  percentOff?: number;
}

/**
 * Validates a promo code for the checkout sidebar WITHOUT consuming it —
 * returns the code + percentage so the client can live-render the saving
 * against the current basket. placeOrderAction re-validates authoritatively;
 * this path exists only for the preview, so it's quota-limited to stop it
 * being a bulk code oracle.
 */
export async function previewDiscountAction(
  _prev: DiscountPreviewState,
  formData: FormData,
): Promise<DiscountPreviewState> {
  const rawCode = String(formData.get("discount") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!rawCode) return { error: "Enter a discount code." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "Enter your email address first — codes are tied to it." };
  }

  try {
    // Loopback/dev has no trusted IP (clientIp → null); on Vercel the edge
    // always supplies one, so the quota applies to every real request.
    const ip = await clientIp();
    if (
      ip &&
      (await overQuota(
        `discount:ip:${ip}`,
        DISCOUNT_QUOTA.ip.limit,
        DISCOUNT_QUOTA.ip.windowSec,
      ))
    ) {
      return { error: "Too many code checks — wait a moment and try again." };
    }
  } catch (error) {
    // Fail open: a throttle fault must never block a legitimate preview.
    console.error("[rate-limit] discount preview quota failed:", error);
  }

  const db = await getDb();
  const resolved = await resolveDiscount(db, rawCode, email);
  if (!resolved.ok) return { error: resolved.error };
  return { ok: true, code: resolved.code, percentOff: resolved.percentOff };
}

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

  // Tracked sizes only — a missing row means untracked (never blocks).
  const stockRows =
    rows.length === 0
      ? []
      : await db
          .select()
          .from(productStock)
          .where(
            inArray(
              productStock.productId,
              rows.map((row) => row.id),
            ),
          );
  const stockKey = (productId: string, size: string) =>
    `${productId} ${size}`;
  const stockNow = new Map(
    stockRows.map((row) => [stockKey(row.productId, row.size), row.qty]),
  );

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
    const colorways = normalizeColorways(product.colorways);
    if (!colorways.some((c) => c.name === line.colorway)) {
      return {
        error: `${product.name} has no colourway called ${line.colorway}.`,
      };
    }
    // Stock pre-check for a clear message; the transaction re-enforces it
    // atomically so two simultaneous checkouts can't both take the last unit.
    const available = stockNow.get(stockKey(product.id, line.size));
    if (available !== undefined && available < line.qty) {
      return { error: stockError(product.name, line.size, available) };
    }
  }

  // Promo code (optional): validated against the live table BEFORE anything
  // is written, so a bad/used code fails with a field-level message and
  // never reaches the transaction. The tx re-claims it atomically below.
  const rawDiscount = String(formData.get("discount") ?? "").trim();
  let discount: { codeId: string; code: string; percentOff: number } | null =
    null;
  if (rawDiscount) {
    const resolved = await resolveDiscount(db, rawDiscount, fields.data.email);
    if (!resolved.ok) {
      return { fieldErrors: { discount: [resolved.error] } };
    }
    discount = resolved;
  }

  // Snapshot lines for order_items — the variant image is whichever art the
  // selected colourway shows (mirrors AddToCart on the product page).
  const items = basket.map((line) => {
    const product = bySlug.get(line.slug)!;
    const images = productImages({
      slug: product.slug,
      imageA: product.imageA ?? undefined,
      imageB: product.imageB ?? undefined,
    });
    const variant = normalizeColorways(product.colorways).find(
      (c) => c.name === line.colorway,
    );
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: line.size,
      colorway: line.colorway,
      qty: line.qty,
      unitPricePence: product.pricePence,
      image: variant?.image === "b" ? images.b : images.a,
    };
  });

  const subtotalPence = items.reduce(
    (sum, item) => sum + item.unitPricePence * item.qty,
    0,
  );
  const discountPence = discount
    ? discountPenceFor(subtotalPence, discount.percentOff)
    : 0;
  // The free-delivery threshold applies to what the customer actually pays.
  const deliveryPence = deliveryPenceFor(subtotalPence - discountPence);
  const totalPence = subtotalPence - discountPence + deliveryPence;

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
    discountCode: discount?.code ?? null,
    discountPence: discount ? discountPence : null,
  };

  let orderCode = "";
  let orderId = "";
  let placed = false;
  for (let attempt = 0; attempt < 3 && !placed; attempt++) {
    orderCode = newOrderCode();
    try {
      await db.transaction(async (tx) => {
        // Take the stock first: sizes without a row are untracked and skip
        // the guard entirely. gte(…) makes each decrement atomic — if the
        // last unit went to a concurrent checkout, this throws and the
        // whole order rolls back.
        for (const line of basket) {
          const product = bySlug.get(line.slug)!;
          if (!stockNow.has(stockKey(product.id, line.size))) continue;
          const [decremented] = await tx
            .update(productStock)
            .set({ qty: sql`${productStock.qty} - ${line.qty}` })
            .where(
              and(
                eq(productStock.productId, product.id),
                eq(productStock.size, line.size),
                gte(productStock.qty, line.qty),
              ),
            )
            .returning({ qty: productStock.qty });
          if (!decremented) {
            throw new InsufficientStockError(
              `${product.name} in size ${line.size} just sold out — please adjust your basket.`,
            );
          }
        }
        const [row] = await tx
          .insert(orders)
          .values({ code: orderCode, ...order })
          .returning({ id: orders.id });
        orderId = row.id;

        // Claim the promo inside the same transaction: the guarded counter
        // bump re-checks active/expiry/cap, and the unique (code_id, email)
        // insert closes the double-redeem race — losing either aborts the
        // whole order (DiscountError below) instead of double-counting.
        if (discount) {
          const claimed = await claimDiscount(
            tx,
            discount.codeId,
            fields.data.email,
            row.id,
          );
          if (!claimed) {
            throw new DiscountError(
              "That code has just been used or is no longer available — remove it and try again.",
            );
          }
        }

        await tx
          .insert(orderItems)
          .values(items.map((item) => ({ ...item, orderId: row.id })));
      });
      placed = true;
    } catch (error) {
      // Lost the stock race between pre-check and commit — the transaction
      // already rolled back, so just tell the customer what happened.
      if (error instanceof InsufficientStockError) {
        return { error: error.message };
      }
      if (error instanceof DiscountError) {
        return { fieldErrors: { discount: [error.message] } };
      }
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

  // Transactional emails run strictly AFTER the commit, best-effort:
  // sendEmail never throws, so a mail fault can't lose an order that has
  // already succeeded (it logs and no-ops without RESEND_API_KEY too).
  await Promise.all([
    sendEmail(orderConfirmationEmail({ ...order, code: orderCode }, items)),
    sendEmail(newOrderAlertEmail({ ...order, code: orderCode }, items, orderId)),
  ]);

  // Outside every catch: redirect() throws NEXT_REDIRECT, which must escape.
  revalidatePath("/", "layout");
  redirect(`/checkout/success/${orderCode}`);
}
