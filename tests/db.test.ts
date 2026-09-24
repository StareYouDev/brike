import { describe, expect, it } from "vitest";
import { getDb } from "../lib/db";
import { ensureSeeded } from "../lib/db/seed";
import {
  getAllCollections,
  getAllProducts,
  getAnnouncements,
  getCollectionProducts,
  getProductCount,
  getRelatedProducts,
  productImages,
} from "../lib/queries";
import {
  announcements as catalogAnnouncements,
  collections as catalogCollections,
  products as catalogProducts,
} from "../data/catalog";

describe("database layer", () => {
  it("seeds the full catalog from data/catalog.ts", { timeout: 30_000 }, async () => {
    const all = await getAllProducts();
    expect(all).toHaveLength(catalogProducts.length);
    const cols = await getAllCollections();
    expect(cols).toHaveLength(catalogCollections.length);
    expect(await getProductCount()).toBe(catalogProducts.length);
  });

  it("maps pence back to the exact pound prices the UI expects", async () => {
    const all = await getAllProducts();
    for (const seed of catalogProducts) {
      const row = all.find((p) => p.slug === seed.slug);
      expect(row, seed.slug).toBeDefined();
      expect(row!.price, seed.slug).toBe(seed.price);
      if (seed.compareAt !== undefined) {
        expect(row!.compareAt, seed.slug).toBe(seed.compareAt);
      }
      expect(row!.collections.toSorted(), seed.slug).toEqual(
        seed.collections.toSorted(),
      );
      expect(row!.sizes, seed.slug).toEqual(seed.sizes);
      expect(row!.print, seed.slug).toEqual(seed.print);
      expect(row!.featured ?? false, seed.slug).toBe(seed.featured ?? false);
    }
  });

  it("collection membership behaves like the static helpers", async () => {
    const all = await getAllProducts();
    for (const c of catalogCollections) {
      const expected = catalogProducts.filter((p) =>
        p.collections.includes(c.slug),
      );
      expect(
        getCollectionProducts(all, c.slug).map((p) => p.slug).toSorted(),
        c.slug,
      ).toEqual(expected.map((p) => p.slug).toSorted());
    }
  });

  it("getRelatedProducts excludes the product itself and respects the limit", async () => {
    const all = await getAllProducts();
    const seed = all[0];
    const related = getRelatedProducts(seed, all, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.map((p) => p.slug)).not.toContain(seed.slug);
    for (const item of related) {
      expect(item.collections.some((c) => seed.collections.includes(c))).toBe(
        true,
      );
    }
  });

  it("seeding is idempotent (admin edits survive re-runs)", async () => {
    const db = await getDb();
    const before = await getProductCount();
    await ensureSeeded(db);
    await ensureSeeded(db);
    expect(await getProductCount()).toBe(before);
    const cols = await getAllCollections();
    expect(cols).toHaveLength(catalogCollections.length);
  });

  it("seeds the announcement bar copy in order", async () => {
    expect(await getAnnouncements()).toEqual(catalogAnnouncements);
  });
});

describe("productImages", () => {
  it("falls back to the generated SVG artwork", () => {
    expect(productImages({ slug: "scarlet-dots-nightdress" })).toEqual({
      a: "/prints/scarlet-dots-nightdress-a.svg",
      b: "/prints/scarlet-dots-nightdress-b.svg",
    });
  });

  it("prefers uploaded images and reuses imageA when imageB is missing", () => {
    expect(
      productImages({
        slug: "x",
        imageA: "https://cdn.example/x-a.png",
        imageB: "https://cdn.example/x-b.png",
      }),
    ).toEqual({
      a: "https://cdn.example/x-a.png",
      b: "https://cdn.example/x-b.png",
    });
    expect(productImages({ slug: "x", imageA: "https://cdn.example/x-a.png" })).toEqual(
      {
        a: "https://cdn.example/x-a.png",
        b: "https://cdn.example/x-a.png",
      },
    );
  });
});
