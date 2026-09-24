/**
 * Shared helpers for admin server actions (Phase 3 CRUD).
 *
 * Security (securly): server actions are callable endpoints — hidden buttons
 * are NOT authorization. Every mutation calls requireAdmin() FIRST; the
 * proxy.ts cookie guard and the layout redirect are defense-in-depth, not the
 * primary check.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Throws a redirect to the login page when there is no valid session. */
export async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session) redirect("/admin/login");
}

/** Result shape for useActionState-driven forms. */
export interface ActionState {
  /** Form-level (banner) error. */
  error?: string;
  /** zod flatten() field errors — keys match input names. */
  fieldErrors?: Record<string, string[] | undefined>;
  /** Set by actions that complete in place (no redirect) so UIs can confirm. */
  ok?: boolean;
}

/** True when a Postgres unique-constraint violation surfaced (slug clash). */
export function isDuplicateKeyError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "23505") return true;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("duplicate key") || message.includes("UNIQUE constraint");
}

/** UUID gate — malformed ids never reach Postgres (`invalid uuid` 500s). */
export function parseUuid(id: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}
