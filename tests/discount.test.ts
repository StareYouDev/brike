import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../lib/db";
import { discountCodes, discountRedemptions } from "../lib/db/schema";
import {
  discountPenceFor,
  normalizeDiscountCode,
  resolveDiscount,
} from "../lib/discount";

describe("discount codes", () => {
  it("seeds WELCOME10 at 10% and active", { timeout: 30_000 }, async () => {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, "WELCOME10"));
    expect(row).toBeDefined();
    expect(row!.percentOff).toBe(10);
    expect(row!.active).toBe(true);
  });

  it("normalises input when resolving a valid code", async () => {
    const db = await getDb();
    const res = await resolveDiscount(
      db,
      "  welcome10  ",
      "normalize@example.test",
    );
    expect(res).toMatchObject({ ok: true, code: "WELCOME10", percentOff: 10 });
  });

  it("rejects unknown, inactive and expired codes", async () => {
    const db = await getDb();
    expect((await resolveDiscount(db, "NOPE", "a@example.test")).ok).toBe(false);

    await db
      .insert(discountCodes)
      .values({ code: "OLDCODE", percentOff: 15, active: false });
    const inactive = await resolveDiscount(db, "OLDCODE", "a@example.test");
    expect(inactive.ok).toBe(false);

    await db.insert(discountCodes).values({
      code: "EXPIREDCODE",
      percentOff: 20,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const expired = await resolveDiscount(db, "EXPIREDCODE", "a@example.test");
    expect(expired.ok).toBe(false);
    if (!expired.ok) expect(expired.error).toContain("expired");
  });

  it("allows a code once per email and rejects the second use", async () => {
    const db = await getDb();
    const first = await resolveDiscount(db, "WELCOME10", "once@example.test");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await db
      .insert(discountRedemptions)
      .values({ codeId: first.codeId, email: "once@example.test" });

    const second = await resolveDiscount(db, "WELCOME10", "once@example.test");
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("already been used");

    // A different email still gets the code.
    expect(
      (await resolveDiscount(db, "WELCOME10", "someone-else@example.test")).ok,
    ).toBe(true);
  });

  it("floors the percentage to whole pence", () => {
    expect(discountPenceFor(1999, 10)).toBe(199);
    expect(discountPenceFor(1250, 10)).toBe(125);
    expect(discountPenceFor(45, 10)).toBe(4);
    expect(discountPenceFor(0, 10)).toBe(0);
  });

  it("normalises codes by trimming and uppercasing", () => {
    expect(normalizeDiscountCode("  welcome10 ")).toBe("WELCOME10");
  });
});
