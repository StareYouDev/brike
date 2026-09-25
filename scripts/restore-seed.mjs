// One-shot repair: restore any catalog seed rows missing from the database.
// The seed only fills EMPTY tables, so a row deleted at runtime never comes
// back — this fills the gaps (ON CONFLICT DO NOTHING, never overwrites admin
// edits). Run: node scripts/restore-seed.mjs
import fs from "node:fs";
import postgres from "postgres";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) throw new Error("DATABASE_URL not found in .env.local");

const { products, collections, announcements } = await import(
  "../data/catalog.ts"
);

const sql = postgres(url, { max: 1, onnotice: () => {} });

// ---- collections ----
let collectionsAdded = 0;
for (const [i, c] of collections.entries()) {
  const [res] = await sql`
    INSERT INTO collections (slug, title, short_title, description, print_type, print_a, print_b, sort_order)
    VALUES (${c.slug}, ${c.title}, ${c.shortTitle}, ${c.description},
            ${c.print.type}, ${c.print.a}, ${c.print.b}, ${i})
    ON CONFLICT (slug) DO NOTHING RETURNING id`;
  if (res) collectionsAdded++;
}

// ---- products ----
let productsAdded = 0;
for (const [i, p] of products.entries()) {
  const [res] = await sql`
    INSERT INTO products (slug, name, price_pence, compare_at_pence, badge, style, fabric,
                          description, details, colorways, sizes, print_type, print_a, print_b,
                          rating, reviews, featured, sort_order)
    VALUES (${p.slug}, ${p.name}, ${Math.round(p.price * 100)},
            ${p.compareAt !== undefined ? Math.round(p.compareAt * 100) : null},
            ${p.badge ?? null}, ${p.style}, ${p.fabric}, ${p.description},
            ${sql.json(p.details)}, ${sql.json(p.colorways)}, ${sql.json(p.sizes)},
            ${p.print.type}, ${p.print.a}, ${p.print.b},
            ${p.rating}, ${p.reviews}, ${p.featured ?? false}, ${i})
    ON CONFLICT (slug) DO NOTHING RETURNING id`;
  if (res) productsAdded++;
}

// ---- product ↔ collection links ----
const cols = await sql`SELECT id, slug FROM collections`;
const prods = await sql`SELECT id, slug FROM products`;
const colId = new Map(cols.map((c) => [c.slug, c.id]));
const prodId = new Map(prods.map((p) => [p.slug, p.id]));
let linksAdded = 0;
for (const p of products) {
  for (const slug of p.collections) {
    const productId = prodId.get(p.slug);
    const collectionId = colId.get(slug);
    if (!productId || !collectionId) continue;
    const [res] = await sql`
      INSERT INTO product_collections (product_id, collection_id)
      VALUES (${productId}, ${collectionId})
      ON CONFLICT DO NOTHING RETURNING collection_id`;
    if (res) linksAdded++;
  }
}

// ---- announcements (no unique key — match on exact text) ----
let announcementsAdded = 0;
for (const [i, text] of announcements.entries()) {
  const [res] = await sql`
    INSERT INTO announcements (text, sort_order)
    SELECT ${text}, ${i}
    WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE text = ${text})
    RETURNING id`;
  if (res) announcementsAdded++;
}

const total = await sql`SELECT count(*)::int AS n FROM products`;
console.log(
  `collections +${collectionsAdded} · products +${productsAdded} · links +${linksAdded} · announcements +${announcementsAdded} · products total ${total[0].n}`,
);
await sql.end();
