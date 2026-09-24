/**
 * Storefront read layer. All queries fetch the (small) full catalog and map
 * rows to the app-level Product/Collection types from data/catalog.ts, so UI
 * components and tests stay unchanged. Prices: DB pence → UI pounds.
 *
 * Pages are statically prerendered with these reads; admin mutations call
 * revalidatePath("/", "layout") to refresh them on the next visit.
 */
import { asc, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  announcements as announcementsTable,
  collections as collectionsTable,
  productCollections,
  products as productsTable,
} from "@/lib/db/schema";
import type { Collection, Product } from "@/data/catalog";

export { collectionImage, productImages } from "@/lib/images";

const BADGES = new Set(["New", "Best Seller", "Sale", "Low Stock"]);

function toProduct(
  row: typeof productsTable.$inferSelect,
  collectionSlugs: string[],
): Product {
  const badge =
    row.badge && BADGES.has(row.badge)
      ? (row.badge as NonNullable<Product["badge"]>)
      : undefined;
  return {
    slug: row.slug,
    name: row.name,
    price: row.pricePence / 100,
    compareAt:
      row.compareAtPence !== null ? row.compareAtPence / 100 : undefined,
    badge,
    collections: collectionSlugs,
    style: row.style,
    fabric: row.fabric,
    sizes: row.sizes,
    colorways: row.colorways,
    description: row.description,
    details: row.details,
    print: { type: row.printType as Product["print"]["type"], a: row.printA as Product["print"]["a"], b: row.printB as Product["print"]["b"] },
    rating: row.rating,
    reviews: row.reviews,
    featured: row.featured ? true : undefined,
    imageA: row.imageA ?? undefined,
    imageB: row.imageB ?? undefined,
  };
}

function toCollection(row: typeof collectionsTable.$inferSelect): Collection {
  return {
    slug: row.slug,
    title: row.title,
    shortTitle: row.shortTitle,
    description: row.description,
    image: row.image ?? undefined,
    print: {
      type: row.printType as Collection["print"]["type"],
      a: row.printA as Collection["print"]["a"],
      b: row.printB as Collection["print"]["b"],
    },
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  const [rows, links, cols] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.name)),
    db.select().from(productCollections),
    db.select().from(collectionsTable),
  ]);
  const slugById = new Map(cols.map((c) => [c.id, c.slug]));
  const collectionSlugsByProduct = new Map<string, string[]>();
  for (const link of links) {
    const slug = slugById.get(link.collectionId);
    if (!slug) continue;
    const list = collectionSlugsByProduct.get(link.productId) ?? [];
    list.push(slug);
    collectionSlugsByProduct.set(link.productId, list);
  }
  return rows.map((row) => toProduct(row, collectionSlugsByProduct.get(row.id) ?? []));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(collectionsTable)
    .orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.title));
  return rows.map(toCollection);
}

export async function getCollectionBySlug(
  slug: string,
): Promise<Collection | undefined> {
  const all = await getAllCollections();
  return all.find((c) => c.slug === slug);
}

/** Mirrors data/catalog.ts getCollectionProducts, against DB rows. */
export function getCollectionProducts(
  allProducts: Product[],
  collectionSlug: string,
): Product[] {
  return allProducts.filter((p) => p.collections.includes(collectionSlug));
}

/** Mirrors data/catalog.ts getRelatedProducts. */
export function getRelatedProducts(
  product: Product,
  allProducts: Product[],
  limit = 4,
): Product[] {
  return allProducts
    .filter(
      (p) =>
        p.slug !== product.slug &&
        p.collections.some((c) => product.collections.includes(c)),
    )
    .slice(0, limit);
}

export async function getAnnouncements(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(asc(announcementsTable.sortOrder));
  return rows.map((r) => r.text);
}

export async function getProductCount(): Promise<number> {
  const db = await getDb();
  const rows = await db.select({ value: count() }).from(productsTable);
  return Number(rows[0]?.value ?? 0);
}
