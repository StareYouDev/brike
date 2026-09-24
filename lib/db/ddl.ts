/**
 * Idempotent DDL — the single source of truth for the database structure at
 * runtime. Every statement here mirrors lib/db/schema.ts; if you change one,
 * change the other. Executed (in order) once per process before first use.
 */
export const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'admin',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    short_title text NOT NULL,
    description text NOT NULL,
    image text,
    print_type text NOT NULL,
    print_a text NOT NULL,
    print_b text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    price_pence integer NOT NULL,
    compare_at_pence integer,
    badge text,
    style text NOT NULL,
    fabric text NOT NULL,
    description text NOT NULL,
    details jsonb NOT NULL,
    colorways jsonb NOT NULL,
    sizes jsonb NOT NULL,
    print_type text NOT NULL,
    print_a text NOT NULL,
    print_b text NOT NULL,
    image_a text,
    image_b text,
    rating real NOT NULL,
    reviews integer NOT NULL,
    featured boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS product_collections (
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending',
    payment_method text NOT NULL DEFAULT 'cod',
    email text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address1 text NOT NULL,
    address2 text,
    city text NOT NULL,
    postcode text NOT NULL,
    country text NOT NULL DEFAULT 'United Kingdom',
    notes text,
    subtotal_pence integer NOT NULL,
    delivery_pence integer NOT NULL,
    total_pence integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at)`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    slug text NOT NULL,
    name text NOT NULL,
    size text NOT NULL,
    colorway text NOT NULL,
    qty integer NOT NULL,
    unit_price_pence integer NOT NULL,
    image text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    ip text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS login_attempts_email_created_idx ON login_attempts (email, created_at)`,
  `CREATE INDEX IF NOT EXISTS login_attempts_ip_created_idx ON login_attempts (ip, created_at)`,
];
