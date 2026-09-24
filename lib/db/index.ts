/**
 * Database connection factory.
 *
 * Resolution order:
 *   1. DATABASE_URL            → Postgres (Neon in production) via postgres-js
 *   2. local file (.data/pglite) → PGlite (dev / `next start` on Windows — no Docker)
 *   3. in-memory PGlite         → tests, Vercel without DATABASE_URL (ephemeral!)
 *
 * First use runs the idempotent DDL + seed exactly once per process.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { DDL_STATEMENTS } from "@/lib/db/ddl";
import { ensureSeeded } from "@/lib/db/seed";
import { schema, type AppDB } from "@/lib/db/schema";

let initPromise: Promise<AppDB> | null = null;

function createMemoryDb(): AppDB {
  return drizzlePglite(new PGlite(), { schema }) as unknown as AppDB;
}

async function createDb(): Promise<AppDB> {
  const url = process.env.DATABASE_URL;

  // Forced in-memory (unit tests / PGMEMORY=1) wins over DATABASE_URL so
  // tests never touch a real database — DATABASE_URL now exists locally too.
  const useMemory =
    process.env.NODE_ENV === "test" || process.env.PGMEMORY === "1";

  if (useMemory) return createMemoryDb();

  if (url) {
    // prepare: false keeps us compatible with Neon's pooled (pgbouncer) URL.
    const client = postgres(url, { max: 5, prepare: false });
    return drizzlePostgres(client, { schema }) as unknown as AppDB;
  }

  if (process.env.VERCEL) {
    console.warn(
      "[db] DATABASE_URL is missing on Vercel — falling back to an ephemeral in-memory database. Orders and admin edits will NOT persist. Set DATABASE_URL.",
    );
    return createMemoryDb();
  }

  const dir = join(process.cwd(), ".data", "pglite");
  mkdirSync(dir, { recursive: true });
  return drizzlePglite(new PGlite(dir), { schema }) as unknown as AppDB;
}

/**
 * DDL + seed run inside one transaction holding a cross-process advisory
 * lock, so concurrent build workers and cold-starting functions serialize
 * against Postgres instead of racing CREATE TABLE or double-seeding tables
 * that have no unique guard (announcements).
 */
async function runSetup(db: AppDB): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql.raw("select pg_advisory_xact_lock(918273645)"));
    for (const statement of DDL_STATEMENTS) {
      await tx.execute(sql.raw(statement));
    }
    await ensureSeeded(tx as unknown as AppDB);
  });
}

async function init(): Promise<AppDB> {
  const db = await createDb();
  try {
    await runSetup(db);
    return db;
  } catch (error) {
    if (process.env.DATABASE_URL) throw error; // production must fail loudly
    console.warn("[db] local file database failed, using in-memory:", error);
    const memory = createMemoryDb();
    await runSetup(memory);
    return memory;
  }
}

/**
 * Memoized async accessor — DDL + seed run once per process; every caller
 * shares the same connection pool.
 */
export function getDb(): Promise<AppDB> {
  if (!initPromise) {
    initPromise = init().catch((error) => {
      initPromise = null; // allow retry after transient failures
      throw error;
    });
  }
  return initPromise;
}
