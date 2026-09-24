/**
 * Idempotent seeding: fills *empty* tables only, so admin edits made through
 * the dashboard survive redeploys. data/catalog.ts stays the seed source.
 *
 * Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 * (dev defaults below — always override in production).
 */
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";
import {
  announcements as announcementsTable,
  collections as collectionsTable,
  productCollections,
  products as productsTable,
  users,
  type AppDB,
} from "@/lib/db/schema";
import {
  announcements as catalogAnnouncements,
  collections as catalogCollections,
  products as catalogProducts,
} from "@/data/catalog";

async function isEmpty(db: AppDB, table: AnyPgTable): Promise<boolean> {
  const rows = await db.select({ value: count() }).from(table);
  return Number(rows[0]?.value ?? 0) === 0;
}

async function seedCatalog(db: AppDB): Promise<void> {
  for (const [i, c] of catalogCollections.entries()) {
    await db
      .insert(collectionsTable)
      .values({
        slug: c.slug,
        title: c.title,
        shortTitle: c.shortTitle,
        description: c.description,
        printType: c.print.type,
        printA: c.print.a,
        printB: c.print.b,
        sortOrder: i,
      })
      .onConflictDoNothing({ target: collectionsTable.slug });
  }

  for (const [i, p] of catalogProducts.entries()) {
    await db
      .insert(productsTable)
      .values({
        slug: p.slug,
        name: p.name,
        pricePence: Math.round(p.price * 100),
        compareAtPence:
          p.compareAt !== undefined ? Math.round(p.compareAt * 100) : null,
        badge: p.badge ?? null,
        style: p.style,
        fabric: p.fabric,
        description: p.description,
        details: p.details,
        colorways: p.colorways,
        sizes: p.sizes,
        printType: p.print.type,
        printA: p.print.a,
        printB: p.print.b,
        rating: p.rating,
        reviews: p.reviews,
        featured: p.featured ?? false,
        sortOrder: i,
      })
      .onConflictDoNothing({ target: productsTable.slug });
  }

  // Wire up product ↔ collection links (safe to re-run: PK conflicts skipped).
  const cols = await db
    .select({ id: collectionsTable.id, slug: collectionsTable.slug })
    .from(collectionsTable);
  const prods = await db
    .select({ id: productsTable.id, slug: productsTable.slug })
    .from(productsTable);
  const colIdBySlug = new Map(cols.map((c) => [c.slug, c.id]));
  const prodIdBySlug = new Map(prods.map((p) => [p.slug, p.id]));

  for (const p of catalogProducts) {
    const productId = prodIdBySlug.get(p.slug);
    if (!productId) continue;
    for (const slug of p.collections) {
      const collectionId = colIdBySlug.get(slug);
      if (!collectionId) continue;
      await db
        .insert(productCollections)
        .values({ productId, collectionId })
        .onConflictDoNothing();
    }
  }
}

async function seedAnnouncements(db: AppDB): Promise<void> {
  for (const [i, text] of catalogAnnouncements.entries()) {
    await db.insert(announcementsTable).values({ text, sortOrder: i });
  }
}

async function seedAdmin(db: AppDB): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "admin@brike.co.uk").trim();
  const password = process.env.ADMIN_PASSWORD ?? "brike-admin";
  if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "[db] ADMIN_PASSWORD is not set — seeding the admin account with the insecure development default. Set ADMIN_EMAIL/ADMIN_PASSWORD on Vercel.",
    );
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .insert(users)
    .values({ email, passwordHash, name: "Store Admin", role: "admin" })
    .onConflictDoNothing({ target: users.email });
}

/** Runs once per process: catalog → announcements → admin, empty tables only. */
export async function ensureSeeded(db: AppDB): Promise<void> {
  if (await isEmpty(db, productsTable)) await seedCatalog(db);
  if (await isEmpty(db, announcementsTable)) await seedAnnouncements(db);
  if (await isEmpty(db, users)) await seedAdmin(db);
}
