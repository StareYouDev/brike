"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  parseUuid,
  requireAdmin,
  type ActionState,
} from "@/lib/admin-auth";
import { isOrderStatus, ORDER_TRANSITIONS } from "@/lib/admin-form";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/db/schema";

/**
 * Cash-on-delivery fulfilment flow. Transitions are validated against the
 * CURRENT database state — a stale tab or forged payload can never jump
 * pending → delivered or resurrect a cancelled order.
 */
export async function updateOrderStatusAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  if (!parseUuid(id)) return { error: "Unknown order." };

  const status = String(formData.get("status") ?? "");
  if (!isOrderStatus(status)) return { error: "Unknown status." };

  const db = await getDb();
  const [current] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!current) return { error: "That order no longer exists." };
  if (!isOrderStatus(current.status)) {
    return { error: "That order has an invalid status." };
  }

  const allowed = ORDER_TRANSITIONS[current.status];
  if (!allowed.includes(status)) {
    return {
      error: `Cannot move an order from ${current.status} to ${status}.`,
    };
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));

  revalidatePath("/", "layout");
  return {};
}
