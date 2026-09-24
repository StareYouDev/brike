"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/**
 * Empties the basket once the order-confirmation page mounts. Runs in an
 * effect (never during render) so the persisted client cart can never
 * disagree with server-rendered markup.
 */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
