"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { discountCodes, subscribers } from "@/lib/db/schema";
import { sendEmail, welcomeCodeEmail } from "@/lib/email";
import { NEWSLETTER_QUOTA, overQuota } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(200),
});

export interface SubscribeState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Live promo code to show on success (absent when none is active). */
  code?: string;
}

/**
 * Footer newsletter sign-up. Unauthenticated, so: zod on the address, a
 * per-IP quota, and an idempotent insert (re-submitting is a success, not
 * a leak of who's already subscribed). The success copy shows the 10% code
 * on-screen; the welcome email is best-effort — sendEmail never throws, so
 * a mail fault can't fail the signup.
 */
export async function subscribeAction(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const parsed = subscribeSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const email = parsed.data.email;

  try {
    // Loopback/dev has no trusted IP (clientIp → null); on Vercel the edge
    // always supplies one, so the quota applies to every real request.
    const ip = await clientIp();
    if (
      ip &&
      (await overQuota(
        `subscribe:ip:${ip}`,
        NEWSLETTER_QUOTA.ip.limit,
        NEWSLETTER_QUOTA.ip.windowSec,
      ))
    ) {
      return {
        error: "Too many sign-ups from this connection — please try again a little later.",
      };
    }
  } catch (error) {
    // Fail open: a throttle fault must never block a real sign-up (the
    // unique email constraint is the backstop anyway).
    console.error("[rate-limit] newsletter quota check failed:", error);
  }

  const db = await getDb();
  await db
    .insert(subscribers)
    .values({ email, source: "footer" })
    .onConflictDoNothing({ target: subscribers.email });

  // The newsletter's promo code — only promised while it's still live.
  const [promo] = await db
    .select({ code: discountCodes.code })
    .from(discountCodes)
    .where(
      and(eq(discountCodes.code, "WELCOME10"), eq(discountCodes.active, true)),
    )
    .limit(1);
  if (promo) {
    await sendEmail(welcomeCodeEmail(email, promo.code));
  }

  return { ok: true, code: promo?.code };
}
