import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import {
  LOGIN_QUOTA,
  ORDER_QUOTA,
  clearLoginFailures,
  loginLockoutError,
  orderQuotaError,
  overQuota,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { isLoopback, parseClientIp } from "@/lib/request-ip";

const unique = (label: string) =>
  `${label}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

describe("parseClientIp", () => {
  it("returns a bare address as-is", () => {
    expect(parseClientIp("203.0.113.7")).toBe("203.0.113.7");
    expect(parseClientIp(" 203.0.113.7 ")).toBe("203.0.113.7");
  });

  it("trusts the rightmost entry — upstream/client prefixes are ignored", () => {
    expect(parseClientIp("1.2.3.4, 203.0.113.7")).toBe("203.0.113.7");
    // Garbage on the right walks left to the first valid IP.
    expect(parseClientIp("203.0.113.7, not-an-ip")).toBe("203.0.113.7");
  });

  it("handles IPv6 and IPv4-mapped forms", () => {
    expect(parseClientIp("2001:db8::1")).toBe("2001:db8::1");
    expect(parseClientIp("::ffff:192.0.2.1")).toBe("192.0.2.1");
  });

  it("rejects missing or non-IP noise", () => {
    expect(parseClientIp(null)).toBeNull();
    expect(parseClientIp(undefined)).toBeNull();
    expect(parseClientIp("")).toBeNull();
    expect(parseClientIp("evil-value")).toBeNull();
  });
});

describe("isLoopback", () => {
  it("recognises 127.0.0.0/8 and ::1 only", () => {
    expect(isLoopback("127.0.0.1")).toBe(true);
    expect(isLoopback("127.31.5.9")).toBe(true);
    expect(isLoopback("::1")).toBe(true);
    expect(isLoopback("8.8.8.8")).toBe(false);
  });
});

describe("overQuota (fixed-window counters)", () => {
  // First DB test in this file pays the one-time DDL + catalog seed cost.
  it(
    "allows up to the limit, blocks attempt limit + 1",
    { timeout: 30_000 },
    async () => {
      const key = unique("q");
      expect(await overQuota(key, 2, 60)).toBe(false);
      expect(await overQuota(key, 2, 60)).toBe(false);
      expect(await overQuota(key, 2, 60)).toBe(true);
    },
  );
  it("starts a fresh window once the old one expires", async () => {
    const key = unique("w");
    expect(await overQuota(key, 1, 60)).toBe(false);
    expect(await overQuota(key, 1, 60)).toBe(true);

    // Age the row past the window — the next hit must reset to count 1.
    const db = await getDb();
    await db
      .update(rateLimits)
      .set({ windowStart: new Date(Date.now() - 120_000) })
      .where(eq(rateLimits.key, key));
    expect(await overQuota(key, 1, 60)).toBe(false);
    expect(await overQuota(key, 1, 60)).toBe(true);
  });
});

describe("orderQuotaError", () => {
  it("passes normal ordering, then blocks the overflowing email", async () => {
    const email = unique("shopper") + "@example.test";
    for (let i = 0; i < ORDER_QUOTA.email.limit; i++) {
      expect(await orderQuotaError(email, null)).toBeNull();
    }
    expect(await orderQuotaError(email, null)).toMatch(/Too many orders/);
  });

  it("a blocked email does not exhaust other customers' quota", async () => {
    const email = unique("other") + "@example.test";
    expect(await orderQuotaError(email, null)).toBeNull();
  });
});

describe("login lockout", () => {
  it("locks an account after LOGIN_QUOTA.email failures; success clears it", async () => {
    const email = unique("victim") + "@example.test";
    const ip = unique("ip-a");

    for (let i = 0; i < LOGIN_QUOTA.email.limit; i++) {
      expect(await loginLockoutError(email, ip)).toBeNull();
      await recordLoginFailure(email, ip);
    }
    expect(await loginLockoutError(email, ip)).toMatch(
      /Too many sign-in attempts for this account/,
    );

    await clearLoginFailures(email);
    expect(await loginLockoutError(email, ip)).toBeNull();
  });

  it("locks a whole IP after LOGIN_QUOTA.ip failures across many accounts", async () => {
    const ip = unique("ip-bulk");
    for (let i = 0; i < LOGIN_QUOTA.ip.limit; i++) {
      const email = unique(`bulk${i}`) + "@example.test";
      expect(await loginLockoutError(email, ip)).toBeNull();
      await recordLoginFailure(email, ip);
    }
    const freshEmail = unique("fresh") + "@example.test";
    expect(await loginLockoutError(freshEmail, ip)).toMatch(
      /Too many sign-in attempts from this connection/,
    );
    // A different connection is unaffected.
    expect(await loginLockoutError(freshEmail, unique("ip-c"))).toBeNull();
  });
});
