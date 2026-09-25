/**
 * Drizzle schema for the BRIKE shop. Hand-written idempotent DDL lives in
 * ./ddl.ts and MUST be kept in sync with this file (no drizzle-kit dependency).
 *
 * Money is stored as integer pence everywhere; lib/queries.ts maps to the
 * app-level Product/Collection shapes (pounds) used by the UI.
 */
import type { PgliteDatabase } from "drizzle-orm/pglite";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Colorway } from "@/data/catalog";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  shortTitle: text("short_title").notNull(),
  description: text("description").notNull(),
  /** Optional uploaded banner; falls back to the generated SVG artwork. */
  image: text("image"),
  printType: text("print_type").notNull(),
  printA: text("print_a").notNull(),
  printB: text("print_b").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  pricePence: integer("price_pence").notNull(),
  compareAtPence: integer("compare_at_pence"),
  badge: text("badge"),
  style: text("style").notNull(),
  fabric: text("fabric").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").$type<string[]>().notNull(),
  /** Structured rows now; legacy rows hold plain name strings (normalize on read). */
  colorways: jsonb("colorways").$type<Array<string | Colorway>>().notNull(),
  sizes: jsonb("sizes").$type<string[]>().notNull(),
  printType: text("print_type").notNull(),
  printA: text("print_a").notNull(),
  printB: text("print_b").notNull(),
  /** Optional uploaded images; fall back to generated /prints/<slug>-{a,b}.svg. */
  imageA: text("image_a"),
  imageB: text("image_b"),
  rating: real("rating").notNull(),
  reviews: integer("reviews").notNull(),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Per-size stock. A missing row means the size is *untracked* — it never
 * blocks checkout (the honest default until real counts are entered).
 * Row present + qty 0 = sold out everywhere.
 */
export const productStock = pgTable(
  "product_stock",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.size] })],
);

export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Public reference shown to the customer, e.g. BRK-4F7K2Q. */
    code: text("code").notNull().unique(),
    /** pending → confirmed → shipped → delivered (+ cancelled). */
    status: text("status").notNull().default("pending"),
    /** Cash on delivery — no online payment is ever taken. */
    paymentMethod: text("payment_method").notNull().default("cod"),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    postcode: text("postcode").notNull(),
    country: text("country").notNull().default("United Kingdom"),
    notes: text("notes"),
    subtotalPence: integer("subtotal_pence").notNull(),
    deliveryPence: integer("delivery_pence").notNull(),
    totalPence: integer("total_pence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("orders_created_at_idx").on(t.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Kept as snapshot fields so deleting a product never rewrites history. */
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    size: text("size").notNull(),
    colorway: text("colorway").notNull(),
    qty: integer("qty").notNull(),
    unitPricePence: integer("unit_price_pence").notNull(),
    image: text("image").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    ip: text("ip").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("login_attempts_email_created_idx").on(t.email, t.createdAt),
    index("login_attempts_ip_created_idx").on(t.ip, t.createdAt),
  ],
);

/**
 * Fixed-window counters for public-mutation rate limiting (securly: per-IP
 * and per-user limits on public endpoints). One row per bucket key; expiry
 * is a timestamp comparison resolved inside a single atomic upsert, so
 * concurrent serverless instances can never race the counter.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true })
    .notNull()
    .defaultNow(),
  count: integer("count").notNull().default(0),
});

/**
 * Public PDP reviews (stars + comment), submitted through the rate-limited
 * review action. Deleting a product cascades its reviews away.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_product_created_idx").on(t.productId, t.createdAt)],
);

/** Key/value JSON settings edited from the admin (form copy, site text…). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Every drizzle query in the app runs against this shape (both drivers). */
export type AppDB = PgliteDatabase<typeof schema>;

export const schema = {
  users,
  collections,
  products,
  productStock,
  productCollections,
  announcements,
  orders,
  orderItems,
  loginAttempts,
  rateLimits,
  reviews,
  settings,
};
