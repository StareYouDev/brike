import { describe, expect, it } from "vitest";
import { site } from "@/data/catalog";
import {
  DELIVERY_FEE_PENCE,
  FREE_DELIVERY_OVER_PENCE,
  ORDER_CODE_RE,
  deliveryPenceFor,
  newOrderCode,
} from "@/lib/checkout";

describe("delivery pricing (COD checkout)", () => {
  it("pins to the site config in whole pence", () => {
    expect(DELIVERY_FEE_PENCE).toBe(395);
    expect(FREE_DELIVERY_OVER_PENCE).toBe(6000);
    expect(DELIVERY_FEE_PENCE).toBe(
      Math.round(site.standardDelivery * 100),
    );
    expect(FREE_DELIVERY_OVER_PENCE).toBe(
      Math.round(site.freeShippingThreshold * 100),
    );
  });

  it("charges the flat fee below the threshold", () => {
    expect(deliveryPenceFor(0)).toBe(395);
    expect(deliveryPenceFor(1)).toBe(395);
    expect(deliveryPenceFor(5999)).toBe(395);
  });

  it("waives delivery exactly at the threshold", () => {
    expect(deliveryPenceFor(6000)).toBe(0);
    expect(deliveryPenceFor(6001)).toBe(0);
    expect(deliveryPenceFor(25_000)).toBe(0);
  });
});

describe("order codes", () => {
  it("generates codes matching the public BRK-XXXXXX pattern", () => {
    for (let i = 0; i < 25; i++) {
      expect(newOrderCode()).toMatch(ORDER_CODE_RE);
    }
  });

  it("excludes ambiguous characters (I, O, 0, 1)", () => {
    const body = Array.from({ length: 60 }, () =>
      newOrderCode().slice("BRK-".length),
    ).join("");
    expect(body).toHaveLength(360);
    expect(body).not.toMatch(/[IO01]/);
  });
});
