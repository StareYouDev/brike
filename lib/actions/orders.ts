"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import {
  parseUuid,
  requireAdmin,
  type ActionState,
} from "@/lib/admin-auth";
import { isOrderStatus, ORDER_TRANSITIONS } from "@/lib/admin-form";
import { getDb } from "@/lib/db";
import { orderItems, orders, productStock } from "@/lib/db/schema";

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

  const changed = await db.transaction(async (tx) => {
    // Guarded update: only the request that actually flips the status may
    // restock, so two admins cancelling at once can't double-count units.
    const [updated] = await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, current.status)))
      .returning({ id: orders.id });
    if (!updated) return false;

    if (status === "cancelled") {
      // Put the units back — but only where a stock row already exists
      // (sizes ordered while untracked stay untracked; deleted products
      // have nothing to restock). `cancelled` is terminal in
      // ORDER_TRANSITIONS, so this runs at most once per order.
      const items = await tx
        .select({
          productId: orderItems.productId,
          size: orderItems.size,
          qty: orderItems.qty,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));
      for (const item of items) {
        if (!item.productId) continue;
        await tx
          .update(productStock)
          .set({ qty: sql`${productStock.qty} + ${item.qty}` })
          .where(
            and(
              eq(productStock.productId, item.productId),
              eq(productStock.size, item.size),
            ),
          );
      }
    }
    return true;
  });
  if (!changed) {
    return {
      error: "That order changed in another tab — reload and try again.",
    };
  }

  revalidatePath("/", "layout");
  return {};
}
