import { site } from "@/data/catalog";

/**
 * Trader identity shown on the policy pages (/returns, /privacy, /terms).
 *
 * The company number and VAT registration are EMPTY until the owner
 * supplies them (flagged in the launch checklist) — they render only when
 * set, so the pages never claim registration details that don't exist.
 * Fill them in here and every policy page picks them up.
 */
export const trader = {
  name: site.name,
  address: site.address,
  email: site.email,
  phone: site.phone,
  /** Companies House number, e.g. "12345678" — owner to supply. */
  companyNumber: "",
  /** VAT registration, e.g. "GB123456789" — owner to supply. */
  vatNumber: "",
};

/** The "who we are" lines the policies share (registration lines optional). */
export function traderDetails(): string[] {
  const lines = [
    `${trader.name}, ${trader.address}`,
    `Email: ${trader.email}`,
    `Phone: ${trader.phone}`,
  ];
  if (trader.companyNumber) {
    lines.push(
      `Registered in England & Wales, company number ${trader.companyNumber}`,
    );
  }
  if (trader.vatNumber) {
    lines.push(`VAT registration number ${trader.vatNumber}`);
  }
  return lines;
}

/** "Last updated" date printed on every policy page. */
export const POLICY_UPDATED = "25 September 2026";
