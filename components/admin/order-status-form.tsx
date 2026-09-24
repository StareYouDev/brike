"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/admin-auth";
import {
  isOrderStatus,
  ORDER_TRANSITIONS,
} from "@/lib/admin-form";

const ACTION_LABELS: Record<string, string> = {
  confirmed: "Confirm order",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
};

/**
 * Cash-on-delivery fulfilment buttons. Only legal next steps render; the
 * server re-validates the transition against current state anyway.
 */
export function OrderStatusForm({
  orderId,
  status,
  action,
}: {
  orderId: string;
  status: string;
  action: (
    id: string,
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action.bind(null, orderId), {});

  if (!isOrderStatus(status)) {
    return (
      <p className="text-[13px] text-muted-foreground">Unknown status.</p>
    );
  }

  const next = ORDER_TRANSITIONS[status];
  if (next.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        {status === "delivered"
          ? "This order has been delivered — nothing left to do."
          : "This order was cancelled — no further actions."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap gap-2">
        {next.map((target) => (
          <Button
            key={target}
            type="submit"
            name="status"
            value={target}
            size="sm"
            variant={target === "cancelled" ? "destructive" : "default"}
          >
            {ACTION_LABELS[target] ?? target}
          </Button>
        ))}
      </form>
      {state.error ? (
        <p role="alert" className="text-[12.5px] text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
