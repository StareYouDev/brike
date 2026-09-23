import { describe, expect, it } from "vitest";
import {
  collections,
  fabricFilters,
  formatPrice,
  getCollection,
  getCollectionProducts,
  getProduct,
  getRelatedProducts,
  mainNavigation,
  products,
  styleFilters,
} from "../data/catalog";

describe("catalog integrity", () => {
  it("product slugs are unique", () => {
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  it("collection slugs are unique", () => {
    expect(new Set(collections.map((c) => c.slug)).size).toBe(
      collections.length,
    );
  });

  it("every product belongs to existing collections", () => {
    for (const product of products) {
      for (const slug of product.collections) {
        expect(getCollection(slug), `${product.slug} → ${slug}`).toBeDefined();
      }
    }
  });

  it("every collection has at least one product", () => {
    for (const collection of collections) {
      expect(
        getCollectionProducts(collection.slug).length,
        collection.slug,
      ).toBeGreaterThan(0);
    }
  });

  it("prices are positive", () => {
    for (const product of products) {
      expect(product.price, product.slug).toBeGreaterThan(0);
    }
  });

  it("compareAt, when present, is above the price", () => {
    for (const product of products) {
      if (product.compareAt !== undefined) {
        expect(product.compareAt, product.slug).toBeGreaterThan(product.price);
      }
    }
  });

  it("ratings stay within 0-5", () => {
    for (const product of products) {
      expect(product.rating, product.slug).toBeGreaterThanOrEqual(0);
      expect(product.rating, product.slug).toBeLessThanOrEqual(5);
    }
  });

  it("every product offers at least one size and colourway", () => {
    for (const product of products) {
      expect(product.sizes.length, product.slug).toBeGreaterThan(0);
      expect(product.colorways.length, product.slug).toBeGreaterThan(0);
    }
  });
});

describe("lookups", () => {
  it("getProduct returns undefined for unknown slugs", () => {
    expect(getProduct("does-not-exist")).toBeUndefined();
  });

  it("getCollectionProducts matches a manual filter", () => {
    for (const collection of collections) {
      const expected = products.filter((p) =>
        p.collections.includes(collection.slug),
      );
      expect(getCollectionProducts(collection.slug)).toEqual(expected);
    }
  });

  it("getRelatedProducts excludes the product itself and respects the limit", () => {
    const seed = products[0];
    const related = getRelatedProducts(seed, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.map((p) => p.slug)).not.toContain(seed.slug);
    for (const item of related) {
      expect(
        item.collections.some((c) => seed.collections.includes(c)),
        item.slug,
      ).toBe(true);
    }
  });
});

describe("filter chips", () => {
  it("every fabric filter matches at least one product", () => {
    for (const fabric of fabricFilters) {
      expect(
        products.some((p) => p.fabric === fabric),
        fabric,
      ).toBe(true);
    }
  });

  it("every style filter matches at least one product", () => {
    for (const style of styleFilters) {
      expect(
        products.some((p) => p.style === style),
        style,
      ).toBe(true);
    }
  });
});

describe("navigation", () => {
  it("mega-menu collection links point at existing collections", () => {
    for (const item of mainNavigation) {
      for (const column of item.columns) {
        for (const link of column.links) {
          expect(link.href.startsWith("/"), link.href).toBe(true);
          const [path] = link.href.split("?");
          if (path.startsWith("/collections/")) {
            const slug = path.replace("/collections/", "");
            expect(getCollection(slug), link.href).toBeDefined();
          }
        }
      }
    }
  });
});

describe("formatPrice", () => {
  it("formats whole numbers", () => {
    expect(formatPrice(85)).toBe("£85.00");
  });

  it("formats decimals", () => {
    expect(formatPrice(38.5)).toBe("£38.50");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("£0.00");
  });
});
