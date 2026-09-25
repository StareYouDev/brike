/**
 * Storefront read layer. All queries fetch the (small) full catalog and map
 * rows to the app-level Product/Collection types from data/catalog.ts, so UI
 * components and tests stay unchanged. Prices: DB pence → UI pounds.
 *
 * Pages are statically prerendered with these reads; admin mutations call
 * revalidatePath("/", "layout") to refresh them on the next visit.
 */
import { asc, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  announcements as announcementsTable,
  collections as collectionsTable,
  orderItems as orderItemsTable,
  orders as ordersTable,
  productCollections,
  products as productsTable,
} from "@/lib/db/schema";
import type { Collection, Colorway, Product } from "@/data/catalog";
import { normalizeColorways } from "@/data/catalog";

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
    colorways: normalizeColorways(row.colorways),
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

export interface AdminOverview {
  products: number;
  collections: number;
  orders: number;
  pendingOrders: number;
  recentOrders: Array<{
    code: string;
    name: string;
    status: string;
    /** Pounds (mapped from pence) for display. */
    total: number;
    createdAt: Date;
  }>;
}

/** Dashboard stats + newest orders (admin-only callers). */
export async function getAdminOverview(): Promise<AdminOverview> {
  const db = await getDb();
  const [products, collections, orders, pending, recent] = await Promise.all([
    db.select({ value: count() }).from(productsTable),
    db.select({ value: count() }).from(collectionsTable),
    db.select({ value: count() }).from(ordersTable),
    db
      .select({ value: count() })
      .from(ordersTable)
      .where(eq(ordersTable.status, "pending")),
    db
      .select({
        code: ordersTable.code,
        name: ordersTable.name,
        status: ordersTable.status,
        totalPence: ordersTable.totalPence,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(5),
  ]);

  const numOf = (rows: Array<{ value: unknown }>): number =>
    Number(rows[0]?.value ?? 0);

  return {
    products: numOf(products),
    collections: numOf(collections),
    orders: numOf(orders),
    pendingOrders: numOf(pending),
    recentOrders: recent.map((r) => ({
      code: r.code,
      name: r.name,
      status: r.status,
      total: r.totalPence / 100,
      createdAt: r.createdAt,
    })),
  };
}

// ---------------------------------------------------------------------------
// Admin read layer (Phase 3 dashboard). Callers are admin-only pages/actions.
// ---------------------------------------------------------------------------

export interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  pricePence: number;
  compareAtPence: number | null;
  badge: string | null;
  featured: boolean;
  sortOrder: number;
  imageA: string | null;
  imageB: string | null;
  collections: string[];
  updatedAt: Date;
}

export interface AdminProductDetail
  extends Omit<AdminProductListItem, "collections"> {
  style: string;
  fabric: string;
  description: string;
  details: string[];
  colorways: Colorway[];
  sizes: string[];
  printType: string;
  printA: string;
  printB: string;
  rating: number;
  reviews: number;
  createdAt: Date;
  collectionIds: string[];
}

/** Product rows for the admin table, optionally filtered by name/slug. */
export async function getAdminProducts(
  q?: string,
): Promise<AdminProductListItem[]> {
  const db = await getDb();
  const where = q
    ? or(
        ilike(productsTable.name, `%${q}%`),
        ilike(productsTable.slug, `%${q}%`),
      )
    : undefined;
  const [rows, links, cols] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(where)
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.name)),
    db.select().from(productCollections),
    db.select().from(collectionsTable),
  ]);
  const slugById = new Map(cols.map((c) => [c.id, c.slug]));
  const byProduct = new Map<string, string[]>();
  for (const link of links) {
    const slug = slugById.get(link.collectionId);
    if (!slug) continue;
    const list = byProduct.get(link.productId) ?? [];
    list.push(slug);
    byProduct.set(link.productId, list);
  }
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    pricePence: row.pricePence,
    compareAtPence: row.compareAtPence,
    badge: row.badge,
    featured: row.featured,
    sortOrder: row.sortOrder,
    imageA: row.imageA,
    imageB: row.imageB,
    collections: byProduct.get(row.id) ?? [],
    updatedAt: row.updatedAt,
  }));
}

/** One product (full row) plus its collection ids for the edit form. */
export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);
  if (!row) return null;
  const links = await db
    .select()
    .from(productCollections)
    .where(eq(productCollections.productId, id));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    pricePence: row.pricePence,
    compareAtPence: row.compareAtPence,
    badge: row.badge,
    featured: row.featured,
    sortOrder: row.sortOrder,
    imageA: row.imageA,
    imageB: row.imageB,
    style: row.style,
    fabric: row.fabric,
    description: row.description,
    details: row.details,
    colorways: normalizeColorways(row.colorways),
    sizes: row.sizes,
    printType: row.printType,
    printA: row.printA,
    printB: row.printB,
    rating: row.rating,
    reviews: row.reviews,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    collectionIds: links.map((l) => l.collectionId),
  };
}

export interface AdminCollectionListItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string | null;
  printType: string;
  printA: string;
  printB: string;
  sortOrder: number;
  productCount: number;
}

export async function getAdminCollections(): Promise<AdminCollectionListItem[]> {
  const db = await getDb();
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(collectionsTable)
      .orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.title)),
    db
      .select({
        collectionId: productCollections.collectionId,
        n: count(),
      })
      .from(productCollections)
      .groupBy(productCollections.collectionId),
  ]);
  const countById = new Map(counts.map((c) => [c.collectionId, Number(c.n)]));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortTitle: row.shortTitle,
    description: row.description,
    image: row.image,
    printType: row.printType,
    printA: row.printA,
    printB: row.printB,
    sortOrder: row.sortOrder,
    productCount: countById.get(row.id) ?? 0,
  }));
}

/** One collection row for the edit form (null when unknown/invalid id). */
export async function getAdminCollection(
  id: string,
): Promise<AdminCollectionListItem | null> {
  const list = await getAdminCollections();
  return list.find((c) => c.id === id) ?? null;
}

export interface AdminAnnouncement {
  id: string;
  text: string;
  sortOrder: number;
}

export async function getAdminAnnouncements(): Promise<AdminAnnouncement[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(asc(announcementsTable.sortOrder));
  return rows.map((r) => ({ id: r.id, text: r.text, sortOrder: r.sortOrder }));
}

export interface AdminOrderListItem {
  id: string;
  code: string;
  status: string;
  name: string;
  email: string;
  totalPence: number;
  itemCount: number;
  createdAt: Date;
}

/** Newest orders first; optional status filter (validated by the caller). */
export async function getAdminOrders(
  status?: string,
): Promise<AdminOrderListItem[]> {
  const db = await getDb();
  const where = status ? eq(ordersTable.status, status) : undefined;
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt)),
    db
      .select({
        orderId: orderItemsTable.orderId,
        n: count(),
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.orderId),
  ]);
  const countById = new Map(counts.map((c) => [c.orderId, Number(c.n)]));
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    name: row.name,
    email: row.email,
    totalPence: row.totalPence,
    itemCount: countById.get(row.id) ?? 0,
    createdAt: row.createdAt,
  }));
}

export interface AdminOrderDetail {
  id: string;
  code: string;
  status: string;
  paymentMethod: string;
  email: string;
  name: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  postcode: string;
  country: string;
  notes: string | null;
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    slug: string;
    name: string;
    size: string;
    colorway: string;
    qty: number;
    unitPricePence: number;
    image: string;
  }>;
}

export async function getAdminOrder(
  id: string,
): Promise<AdminOrderDetail | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    paymentMethod: row.paymentMethod,
    email: row.email,
    name: row.name,
    phone: row.phone,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    notes: row.notes,
    subtotalPence: row.subtotalPence,
    deliveryPence: row.deliveryPence,
    totalPence: row.totalPence,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((i) => ({
      slug: i.slug,
      name: i.name,
      size: i.size,
      colorway: i.colorway,
      qty: i.qty,
      unitPricePence: i.unitPricePence,
      image: i.image,
    })),
  };
}

export interface OrderConfirmation {
  code: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  postcode: string;
  country: string;
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
  createdAt: Date;
  items: Array<{
    slug: string;
    name: string;
    size: string;
    colorway: string;
    qty: number;
    unitPricePence: number;
    image: string;
  }>;
}

/**
 * Checkout confirmation lookup by the public BRK-XXXXXX code. The code is
 * random and unique, so it doubles as an unguessable capability token —
 * no sequential ids ever appear in customer-facing URLs.
 */
export async function getOrderByCode(
  code: string,
): Promise<OrderConfirmation | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.code, code))
    .limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, row.id));
  return {
    code: row.code,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    postcode: row.postcode,
    country: row.country,
    subtotalPence: row.subtotalPence,
    deliveryPence: row.deliveryPence,
    totalPence: row.totalPence,
    createdAt: row.createdAt,
    items: items.map((i) => ({
      slug: i.slug,
      name: i.name,
      size: i.size,
      colorway: i.colorway,
      qty: i.qty,
      unitPricePence: i.unitPricePence,
      image: i.image,
    })),
  };
}

export async function getPendingOrderCount(): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ value: count() })
    .from(ordersTable)
    .where(eq(ordersTable.status, "pending"));
  return Number(rows[0]?.value ?? 0);
}

/**
 * Orders + revenue grouped by UTC day for the overview chart. Cancelled
 * orders still count as activity but contribute no revenue. Days with no
 * activity are present (zeroed) so the chart axis stays continuous.
 */
export async function getAdminDailyOrders(
  days = 14,
): Promise<Array<{ date: string; orders: number; revenue: number }>> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select({
      createdAt: ordersTable.createdAt,
      totalPence: ordersTable.totalPence,
      status: ordersTable.status,
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, since));

  const cells = new Map<string, { orders: number; revenuePence: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000);
    cells.set(day.toISOString().slice(0, 10), {
      orders: 0,
      revenuePence: 0,
    });
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const cell = cells.get(key);
    if (!cell) continue;
    cell.orders += 1;
    if (row.status !== "cancelled") cell.revenuePence += row.totalPence;
  }
  return [...cells.entries()].map(([date, cell]) => ({
    date,
    orders: cell.orders,
    revenue: cell.revenuePence / 100,
  }));
}
