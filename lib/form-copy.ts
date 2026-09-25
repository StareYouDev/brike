/**
 * Form copy — the wording shown by the storefront's contact and checkout
 * pages. Pure data (no DB imports) so both the server pages and the client
 * forms can fall back to these defaults; the admin edits live copies in the
 * settings table (key `form:contact` / `form:checkout`) via lib/form-settings.
 *
 * `{name}` in successTitle and `{total}` in payNoteBody are replaced at
 * render time.
 */

export interface ContactFormCopy {
  /** Contact page H1. */
  heading: string;
  /** Paragraph under the H1. */
  intro: string;
  /** Subject dropdown options (one per line in the admin). */
  subjects: string[];
  /** Submit button label. */
  submitLabel: string;
  /** Small print under the submit button. */
  note: string;
  /** Success heading — `{name}` becomes the sender's first name. */
  successTitle: string;
  /** Success body under the heading. */
  successBody: string;
}

export interface CheckoutFormCopy {
  /** Eyebrow above the H1. */
  eyebrow: string;
  /** Checkout page H1. */
  heading: string;
  /** Paragraph under the H1. */
  intro: string;
  /** "Delivery details" section heading. */
  detailsHeading: string;
  /** Note under the details heading. */
  detailsNote: string;
  /** Basket summary heading. */
  basketHeading: string;
  /** COD callout heading. */
  payNoteHeading: string;
  /** COD callout body — `{total}` becomes the order total. */
  payNoteBody: string;
  /** Submit button label; the total is appended after ` · `. */
  submitLabel: string;
  /** Fine print under the submit button. */
  footnote: string;
}

export const DEFAULT_CONTACT_COPY: ContactFormCopy = {
  heading: "We'd love to hear from you",
  intro:
    "Questions about sizes, prints or an order? The studio team answers every message within one working day.",
  subjects: [
    "Order question",
    "Returns & exchanges",
    "Wholesale",
    "Press",
    "Something else",
  ],
  submitLabel: "Send message",
  note: "Demo form — your details stay in your browser and are never transmitted.",
  successTitle: "Thanks, {name}!",
  successBody:
    "Your message is ready to send — this is a demo storefront, so nothing left your browser. In the live shop we reply within one working day.",
};

export const DEFAULT_CHECKOUT_COPY: CheckoutFormCopy = {
  eyebrow: "Cash on delivery",
  heading: "Checkout",
  intro:
    "Tell us where to deliver and hand the courier the cash when your order lands — no cards, no online payment, no account needed.",
  detailsHeading: "Delivery details",
  detailsNote:
    "Cash on delivery — we currently deliver across the UK in 2–4 working days.",
  basketHeading: "Your basket",
  payNoteHeading: "Cash on delivery only",
  payNoteBody:
    "No card details, no online payment. Have {total} ready when the courier arrives — keep it as close to the total as you can.",
  submitLabel: "Place order",
  footnote: "You'll pay the courier in cash — we never ask for card details.",
};
