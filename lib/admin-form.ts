/**
 * Shared admin form constants — pure data, no imports, safe for both client
 * components and server actions. Values mirror the unions in data/catalog.ts
 * (PatternType / PaletteName) and the orders table's status flow.
 */

export const PATTERN_TYPES = [
  "stripe",
  "gingham",
  "check",
  "dot",
  "floral",
  "celestial",
  "harlequin",
  "leaf",
  "snow",
] as const;

export const PALETTE_NAMES = [
  "navy",
  "blush",
  "sage",
  "cherry",
  "butter",
  "lilac",
  "teal",
  "rust",
  "ink",
  "sky",
  "olive",
] as const;

/** "" = no badge. */
export const BADGES = ["", "New", "Best Seller", "Sale", "Low Stock"] as const;

/** Checkbox set offered in the product form; unknown stored tokens fall back
 *  into the "other sizes" input so no legacy value is ever lost. */
export const SIZE_TOKENS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2-3Y",
  "4-5Y",
  "6-7Y",
  "8-9Y",
  "10-11Y",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Allowed cash-on-delivery fulfilment flow (server enforces, client renders). */
export const ORDER_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
