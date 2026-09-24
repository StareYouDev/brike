/**
 * Cash-on-delivery checkout logic shared by the client summary (display) and
 * the server action (authoritative totals). Pure functions only — no I/O.
 *
 * Delivery is one flat UK fee waived at the threshold from data/catalog.ts
 * (site.*), always computed in integer pence so float rounding can never
 * touch an order total.
 */
import { site } from "@/data/catalog";

export const DELIVERY_FEE_PENCE = Math.round(site.standardDelivery * 100);
export const FREE_DELIVERY_OVER_PENCE = Math.round(
  site.freeShippingThreshold * 100,
);

/** Pence to charge for delivery given a subtotal in pence. */
export function deliveryPenceFor(subtotalPence: number): number {
  return subtotalPence >= FREE_DELIVERY_OVER_PENCE ? 0 : DELIVERY_FEE_PENCE;
}

/**
 * Public order reference, e.g. BRK-4F7K2Q. Ambiguous glyphs (I, O, 0, 1)
 * are excluded so codes survive being read aloud over the phone; 32 symbols
 * divide 256 exactly, so byte-modulo sampling stays unbiased.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const ORDER_CODE_RE = /^BRK-[A-Z0-9]{6}$/;

export function newOrderCode(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `BRK-${code}`;
}
