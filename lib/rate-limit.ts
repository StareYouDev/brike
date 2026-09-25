import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { loginAttempts, rateLimits } from "@/lib/db/schema";

/**
 * Rate limiting for the two unauthenticated surfaces (securly / OWASP:
 * "implement rate limiting per IP and per user on all public endpoints"):
 *
 * - placeOrderAction → fixed-window quotas per email and per IP (rate_limits);
 * - loginAction      → failed-attempt lockout per email and per IP
 *                      (login_attempts, the audit log Phase 3 prepared).
 *
 * Everything is database-backed rather than in-memory: on serverless the
 * process dies between requests and instances don't share counters, so a
 * Map would silently reset — one atomic SQL statement works across all of
 * them. Constants are exported so tests can drive the exact thresholds.
 */

/** Orders one customer / connection may place per window (COD, no payment step). */
export const ORDER_QUOTA = {
  email: { limit: 5, windowSec: 3600 },
  ip: { limit: 10, windowSec: 3600 },
} as const;

/** Failed sign-in attempts allowed before a lockout window kicks in. */
export const LOGIN_QUOTA = {
  email: { limit: 5, windowSec: 900 },
  ip: { limit: 20, windowSec: 900 },
} as const;

/** Public PDP review submissions one connection may post per window. */
export const REVIEW_QUOTA = {
  ip: { limit: 6, windowSec: 3600 },
} as const;

/** Newsletter sign-ups one connection may post per window. */
export const NEWSLETTER_QUOTA = {
  ip: { limit: 5, windowSec: 3600 },
} as const;

/** Checkout promo-code preview checks (stops bulk code guessing). */
export const DISCOUNT_QUOTA = {
  ip: { limit: 20, windowSec: 300 },
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Consumes one unit from a fixed window and reports whether the bucket is
 * now over its limit (attempt `limit + 1` is the first blocked one). The
 * upsert is a single statement, so concurrent instances can't race it, and
 * window expiry is decided by comparing timestamps in the same statement —
 * the app server's clock is the single time source. Expired rows are swept
 * opportunistically to keep the table flat.
 */
export async function overQuota(
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const db = await getDb();
  const now = Date.now();
  const cutoff = new Date(now - windowSec * 1000);
  const current = new Date(now);

  const [row] = await db
    .insert(rateLimits)
    .values({ key: bucket, windowStart: current, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        // ISO strings + explicit casts: raw Date params inside sql`` bypass
        // drizzle's column mappers and postgres-js refuses them (PGlite
        // accepted them — only the Neon path blew up in e2e).
        count: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoff.toISOString()}::timestamptz THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoff.toISOString()}::timestamptz THEN ${current.toISOString()}::timestamptz ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });

  await db
    .delete(rateLimits)
    .where(lt(rateLimits.windowStart, new Date(now - DAY_MS)));

  return row.count > limit;
}

/**
 * Order-placement quota check. Returns a customer-facing error when the
 * email or (when known) IP has placed too many orders in the window, else
 * null. Runs after validation so only well-formed requests consume quota.
 */
export async function orderQuotaError(
  email: string,
  ip: string | null,
): Promise<string | null> {
  try {
    const message =
      "Too many orders right now — please wait a little while and try again.";

    if (
      await overQuota(
        `order:email:${email}`,
        ORDER_QUOTA.email.limit,
        ORDER_QUOTA.email.windowSec,
      )
    ) {
      return message;
    }
    if (
      ip &&
      (await overQuota(
        `order:ip:${ip}`,
        ORDER_QUOTA.ip.limit,
        ORDER_QUOTA.ip.windowSec,
      ))
    ) {
      return message;
    }
    return null;
  } catch (error) {
    // Fail open: a limiter fault must never block a real customer's order —
    // and if the database is genuinely down, the order insert itself is the
    // actual point of failure, not this check.
    console.error("[rate-limit] order quota check failed:", error);
    return null;
  }
}

/** Lockout message for the current credentials, or null when still allowed. */
export async function loginLockoutError(
  email: string,
  ip: string,
): Promise<string | null> {
  // Fail open: a throttle fault must never lock the admin out of their own
  // site — Auth.js still has to validate the credentials either way.
  try {
    const db = await getDb();
    const since = new Date(Date.now() - LOGIN_QUOTA.email.windowSec * 1000);

    const [byEmail] = await db
      .select({ n: count() })
      .from(loginAttempts)
      .where(
        and(eq(loginAttempts.email, email), gte(loginAttempts.createdAt, since)),
      );
    if (Number(byEmail.n) >= LOGIN_QUOTA.email.limit) {
      return "Too many sign-in attempts for this account — try again in a few minutes.";
    }

    const [byIp] = await db
      .select({ n: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), gte(loginAttempts.createdAt, since)));
    if (Number(byIp.n) >= LOGIN_QUOTA.ip.limit) {
      return "Too many sign-in attempts from this connection — try again in a few minutes.";
    }

    return null;
  } catch (error) {
    console.error("[rate-limit] login lockout check failed:", error);
    return null;
  }
}

/** Records one failed sign-in (also feeds the incident audit trail). */
export async function recordLoginFailure(
  email: string,
  ip: string,
): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(loginAttempts).values({ email, ip });
    await db
      .delete(loginAttempts)
      .where(lt(loginAttempts.createdAt, new Date(Date.now() - DAY_MS)));
  } catch (error) {
    // Never replace the friendly "not correct" error with a 500.
    console.error("[rate-limit] recording login failure failed:", error);
  }
}

/** A successful sign-in resets the lockout for that account. */
export async function clearLoginFailures(email: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
  } catch (error) {
    // Losing a reset only extends an existing window — still no 500 on the
    // redirect path (which must escape untouched).
    console.error("[rate-limit] clearing login failures failed:", error);
  }
}
