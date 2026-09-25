import { and, eq, isNull, or, sql } from "drizzle-orm";
import {
  discountCodes,
  discountRedemptions,
  type AppDB,
} from "@/lib/db/schema";

/** Trim + uppercase so "welcome10" and "  WELCOME10 " both match the row. */
export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Percentage of the subtotal, floored to whole pence (never negative). */
export function discountPenceFor(
  subtotalPence: number,
  percentOff: number,
): number {
  return Math.max(0, Math.floor((subtotalPence * percentOff) / 100));
}

export type DiscountResolution =
  | { ok: true; codeId: string; code: string; percentOff: number }
  | { ok: false; error: string };

const invalid = { ok: false, error: "That discount code isn't valid." } as const;

/**
 * Validates a promo code WITHOUT consuming it — shared by the checkout
 * preview and the real placement, so the two can never disagree. The
 * consumption itself (redemption row + counter) happens later inside the
 * order transaction, where the guarded counter update and the composite
 * unique on (code_id, email) close the double-redeem race atomically.
 */
export async function resolveDiscount(
  db: AppDB,
  rawCode: string,
  email: string,
): Promise<DiscountResolution> {
  const [row] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, normalizeDiscountCode(rawCode)))
    .limit(1);
  if (!row || !row.active) return invalid;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "That discount code has expired." };
  }
  if (row.maxRedemptions !== null && row.redemptionsCount >= row.maxRedemptions) {
    return {
      ok: false,
      error: "That discount code has reached its limit.",
    };
  }

  const [used] = await db
    .select({ id: discountRedemptions.id })
    .from(discountRedemptions)
    .where(
      and(
        eq(discountRedemptions.codeId, row.id),
        eq(discountRedemptions.email, email),
      ),
    )
    .limit(1);
  if (used) {
    return {
      ok: false,
      error: "That code has already been used with this email address.",
    };
  }

  return { ok: true, codeId: row.id, code: row.code, percentOff: row.percentOff };
}

/**
 * Claims one redemption inside an open order transaction. Returns false
 * (after rolling nothing back itself — the caller aborts the tx) when the
 * code was deactivated/expired/limit-hit or already redeemed by this email
 * between the pre-check and the commit. Callers throw to abort the order.
 *
 * The counter bump is a guarded UPDATE (WHERE … still valid) and the
 * redemption insert uses ON CONFLICT DO NOTHING returning nothing on a
 * duplicate — either losing race means "no", never a double count.
 */
export async function claimDiscount(
  tx: Parameters<Parameters<AppDB["transaction"]>[0]>[0],
  codeId: string,
  email: string,
  orderId: string,
): Promise<boolean> {
  const [bumped] = await tx
    .update(discountCodes)
    .set({ redemptionsCount: sql`${discountCodes.redemptionsCount} + 1` })
    .where(
      and(
        eq(discountCodes.id, codeId),
        eq(discountCodes.active, true),
        or(isNull(discountCodes.expiresAt), sql`${discountCodes.expiresAt} > now()`),
        or(
          isNull(discountCodes.maxRedemptions),
          sql`${discountCodes.redemptionsCount} < ${discountCodes.maxRedemptions}`,
        ),
      ),
    )
    .returning({ id: discountCodes.id });
  if (!bumped) return false;

  const [redemption] = await tx
    .insert(discountRedemptions)
    .values({ codeId, email, orderId })
    .onConflictDoNothing()
    .returning({ id: discountRedemptions.id });
  return Boolean(redemption);
}
