/**
 * Transactional email via Resend's HTTP API — a hand-rolled fetch client
 * (one POST, no SDK dependency).
 *
 * Every send is BEST-EFFORT by contract: absent configuration, a timeout or
 * an API error logs and resolves `false`, never throws — an email can never
 * fail an order that has already committed or an admin status change.
 *
 * Configuration (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  required to actually send; absent → log + no-op
 *   EMAIL_FROM      optional, default "BRIKE <orders@brike.co.uk>"
 *   OWNER_EMAIL     optional, default admin@brike.co.uk (new-order alerts)
 */
import { formatPrice, site } from "@/data/catalog";

/** Fields the templates need from an order (all customer text is escaped). */
export interface MailOrder {
  code: string;
  name: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string | null;
  city: string;
  postcode: string;
  subtotalPence: number;
  deliveryPence: number;
  totalPence: number;
}

export interface MailItem {
  name: string;
  size: string;
  colorway: string;
  qty: number;
  unitPricePence: number;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape anything customer-controlled before it goes near an HTML email. */
const esc = (value: string | number): string =>
  String(value).replace(
    /[&<>"']/g,
    (char) => HTML_ESCAPES[char] ?? char,
  );

/** True when a RESEND_API_KEY is present — the success page conditions on it. */
export function emailsEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const ownerEmail = (): string =>
  process.env.OWNER_EMAIL ?? "admin@brike.co.uk";

/** Absolute base for links inside emails (prod-correct by default). */
const siteBase = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://brike.vercel.app";

const firstName = (name: string): string => name.trim().split(/\s+/)[0] || name;

const money = (pence: number): string => formatPrice(pence / 100);

const deliveryLabel = (pence: number): string =>
  pence === 0 ? "Free" : money(pence);

/** Shared branded shell — inline styles only (email clients ignore CSS files). */
function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f5f2ec;font-family:Georgia,'Times New Roman',serif;color:#1d1d1b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6ded2;">
    <tr><td style="padding:22px 28px 4px;font-size:20px;font-weight:bold;letter-spacing:0.28em;">BRIKE</td></tr>
    <tr><td style="padding:8px 28px 24px;">${body}</td></tr>
    <tr><td style="padding:14px 28px;background:#f4ead9;font-size:12px;color:#5b564d;">${esc(site.name)} · Designed in London · ${esc(site.email)}</td></tr>
  </table>
</body>
</html>`;
}

const h1 = (text: string): string =>
  `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${text}</h1>`;

const p = (text: string): string =>
  `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;">${text}</p>`;

function itemsTable(items: MailItem[]): string {
  const rows = items
    .map(
      (item) => `      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #eee0cf;font-size:14px;">
          <strong>${esc(item.name)}</strong><br>
          <span style="color:#6b675f;font-size:13px;">${esc(item.colorway)} · Size ${esc(item.size)} · Qty ${item.qty}</span>
        </td>
        <td align="right" valign="top" style="padding:9px 0 9px 16px;border-bottom:1px solid #eee0cf;font-size:14px;white-space:nowrap;">${money(item.unitPricePence * item.qty)}</td>
      </tr>`,
    )
    .join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

function totalsTable(order: MailOrder): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr>
        <td style="padding:6px 0;font-size:${strong ? "16px" : "14px"};${strong ? "font-weight:bold;" : ""}">${label}</td>
        <td align="right" style="padding:6px 0;font-size:${strong ? "16px" : "14px"};${strong ? "font-weight:bold;" : ""}">${value}</td>
      </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      ${row("Subtotal", money(order.subtotalPence))}
      ${row("Delivery", deliveryLabel(order.deliveryPence))}
      ${row("Total (cash on delivery)", money(order.totalPence), true)}
    </table>`;
}

function addressBlock(order: MailOrder): string {
  const lines = [
    esc(order.name),
    esc(order.address1),
    order.address2 ? esc(order.address2) : null,
    `${esc(order.city)}, ${esc(order.postcode)}`,
  ].filter(Boolean);
  return `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;">${lines.join("<br>")}</p>`;
}

function itemsText(items: MailItem[]): string {
  return items
    .map(
      (item) =>
        `  - ${item.name} · ${item.colorway} · size ${item.size} · qty ${item.qty} — ${money(item.unitPricePence * item.qty)}`,
    )
    .join("\n");
}

/** Customer order confirmation — sent once the checkout transaction commits. */
export function orderConfirmationEmail(
  order: MailOrder,
  items: MailItem[],
): Mail {
  const subject = `Order ${order.code} confirmed`;
  const html = shell(
    subject,
    `${h1(`Thanks, ${esc(firstName(order.name))} — your order's in.`)}
    ${p(`We've received order <strong>${esc(order.code)}</strong>. It goes out with cash on delivery, so you'll pay <strong>${money(order.totalPence)}</strong> when it arrives — nothing is charged now.`)}
    ${itemsTable(items)}
    ${totalsTable(order)}
    <p style="margin:16px 0 4px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#6b675f;">Delivering to</p>
    ${addressBlock(order)}
    ${p(`Questions? Just reply to this email and quote ${esc(order.code)}.`)}`,
  );
  const text = [
    `Thanks, ${firstName(order.name)} — your order's in.`,
    "",
    `We've received order ${order.code}. It goes out with cash on delivery,`,
    `so you'll pay ${money(order.totalPence)} when it arrives — nothing is charged now.`,
    "",
    itemsText(items),
    "",
    `Subtotal: ${money(order.subtotalPence)}`,
    `Delivery: ${deliveryLabel(order.deliveryPence)}`,
    `Total (cash on delivery): ${money(order.totalPence)}`,
    "",
    "Delivering to:",
    `  ${order.name}`,
    `  ${order.address1}`,
    order.address2 ? `  ${order.address2}` : null,
    `  ${order.city}, ${order.postcode}`,
    "",
    `Questions? Reply to this email and quote ${order.code}.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
  return { to: order.email, subject, html, text };
}

/** Owner alert — new order landed, with a link straight into the admin. */
export function newOrderAlertEmail(
  order: MailOrder,
  items: MailItem[],
  orderId: string,
): Mail {
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subject = `New order ${order.code} — ${money(order.totalPence)}`;
  const adminUrl = `${siteBase()}/admin/orders/${orderId}`;
  const html = shell(
    subject,
    `${h1(`New order ${esc(order.code)}`)}
    ${p(`<strong>${money(order.totalPence)}</strong> cash on delivery · ${count} item${count === 1 ? "" : "s"} · <a href="${esc(adminUrl)}" style="color:#1d1d1b;">open in admin</a>`)}
    ${itemsTable(items)}
    ${totalsTable(order)}
    <p style="margin:16px 0 4px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#6b675f;">Customer</p>
    ${p(`${esc(order.name)} · <a href="mailto:${esc(order.email)}" style="color:#1d1d1b;">${esc(order.email)}</a>${order.phone ? `<br>${esc(order.phone)}` : ""}`)}
    ${addressBlock(order)}`,
  );
  const text = [
    `New order ${order.code} — ${money(order.totalPence)} cash on delivery`,
    `Admin: ${adminUrl}`,
    "",
    itemsText(items),
    "",
    `Subtotal: ${money(order.subtotalPence)}`,
    `Delivery: ${deliveryLabel(order.deliveryPence)}`,
    `Total: ${money(order.totalPence)}`,
    "",
    "Customer:",
    `  ${order.name} · ${order.email}${order.phone ? ` · ${order.phone}` : ""}`,
    `  ${order.address1}`,
    order.address2 ? `  ${order.address2}` : null,
    `  ${order.city}, ${order.postcode}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
  return { to: ownerEmail(), subject, html, text };
}

/** "On its way" notice — fired when an admin marks the order shipped. */
export function orderShippedEmail(order: {
  code: string;
  name: string;
  email: string;
}): Mail {
  const subject = `Order ${order.code} is on its way`;
  const html = shell(
    subject,
    `${h1(`Your order ${esc(order.code)} has left the studio`)}
    ${p(`Good news, ${esc(firstName(order.name))} — your BRIKE order is on its way to you. Remember, payment is cash on delivery: you'll pay when it arrives.`)}
    ${p(`Anything not right? Reply to this email and quote ${esc(order.code)}.`)}`,
  );
  const text = [
    `Your order ${order.code} has left the studio.`,
    "",
    "Good news — your BRIKE order is on its way. Payment is cash on delivery:",
    "you'll pay when it arrives.",
    "",
    `Anything not right? Reply and quote ${order.code}.`,
  ].join("\n");
  return { to: order.email, subject, html, text };
}

/**
 * Send one email through Resend. Never throws; resolves false on any fault
 * (missing key, timeout, API error) after logging a concise reason.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY not set — skipped "${mail.subject}" → ${mail.to}`,
    );
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "BRIKE <orders@brike.co.uk>",
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 300);
      console.error(`[email] Resend ${response.status} for "${mail.subject}": ${detail}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] send failed for "${mail.subject}":`, error);
    return false;
  }
}
