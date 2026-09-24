import { headers } from "next/headers";

/**
 * Client address for rate-limiting keys.
 *
 * Kept separate from lib/rate-limit.ts so the pure parsing helpers can be
 * unit-tested without importing next/headers (which only resolves inside a
 * request scope).
 */

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6_RE = /^[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}$/i;

/**
 * Picks the trusted client address out of an X-Forwarded-For chain.
 *
 * Rightmost-first: the entry at the end of the chain was appended by the
 * platform edge in front of us (Vercel rewrites this header to the real
 * client address), while anything to its left came from upstream hops or
 * from the client itself — an attacker-controlled prefix must never become
 * a throttle key they can rotate. Values are allowlisted against IP syntax
 * rather than blocklisted, and non-IP noise is skipped.
 */
export function parseClientIp(
  forwardedFor: string | null | undefined,
): string | null {
  if (!forwardedFor) return null;
  const parts = forwardedFor.split(",");
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i].trim().replace(/^::ffff:/i, "").toLowerCase();
    if (IPV4_RE.test(candidate)) return candidate;
    if (candidate.includes(":") && IPV6_RE.test(candidate)) return candidate;
  }
  return null;
}

/** Loopback addresses (127.0.0.0/8, ::1) — local dev / e2e traffic. */
export function isLoopback(ip: string): boolean {
  return ip === "::1" || ip.startsWith("127.");
}

/**
 * The request's client IP, or null when there is no trusted value:
 *
 * - no x-forwarded-for at all (self-hosted `next start`, unit tests);
 * - loopback outside Vercel — dev and e2e share one machine, so a per-IP
 *   bucket would lump every local request together and trip on test runs.
 *
 * On Vercel the header always carries the real client address (edge-set),
 * so the per-IP quota applies to every production request.
 */
export async function clientIp(): Promise<string | null> {
  const raw = (await headers()).get("x-forwarded-for");
  const ip = parseClientIp(raw);
  if (!ip) return null;
  if (isLoopback(ip) && !process.env.VERCEL) return null;
  return ip;
}
