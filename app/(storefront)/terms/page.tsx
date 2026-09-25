import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalSection,
  LegalShell,
  TraderDetails,
} from "@/components/legal";
import { site } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description:
    "The terms that govern orders placed with BRIKE — UK delivery, cash-on-delivery payment, cancellation and returns, warranties and your statutory rights.",
};

/**
 * Terms of sale (Trust bucket, Phase 4). Matches how the shop actually
 * works: guest checkout, cash on delivery only, UK delivery, stock reserved
 * atomically at order time. Statutory consumer rights are expressly
 * preserved (Consumer Rights Act 2015, Consumer Contracts Regulations 2015)
 * — nothing here tries to contract out of them.
 */
export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of sale"
      eyebrow="The fine print"
      intro="The agreement behind every order you place with us — plain-English, UK-law compliant, and nothing in it overrides the rights you already have as a consumer."
    >
      <LegalSection title="Who we are">
        <TraderDetails />
        <p>
          These terms apply to orders placed through {site.name} (this
          website). &quot;We&quot; and &quot;us&quot; mean {site.name};
          &quot;you&quot; means the person placing the order.
        </p>
      </LegalSection>

      <LegalSection title="Placing an order">
        <LegalList
          items={[
            "Orders are placed through guest checkout — no account needed.",
            "Your order confirmation email means we've received it, not that we've accepted it. Acceptance happens when we confirm or dispatch the order.",
            "Stock is reserved for you the moment the order goes through — if a size has genuinely sold out at that instant, we'll tell you instead of taking the order.",
            "We can decline an order (for example if a pricing error is obvious, or we suspect fraud) and won't charge you anything — payment is only ever taken on delivery.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Prices & payment">
        <LegalList
          items={[
            `All prices are in pounds sterling (GBP) and include VAT where applicable, shown before you commit to the order.`,
            `Payment is cash on delivery only — you pay the courier when your parcel arrives. We never collect card or bank details through this site.`,
            `Standard UK delivery is £${site.standardDelivery.toFixed(2)} and free on orders over £${site.freeShippingThreshold}; express delivery is £5.95.`,
          ]}
        />
        <p>
          If we ever spot an obvious pricing error before dispatch, we&apos;ll
          contact you — you can of course cancel for a full refund at that
          point.
        </p>
      </LegalSection>

      <LegalSection title="Delivery">
        <p>
          Standard delivery arrives within 2–4 working days; express orders
          placed before noon go out for the next working day. We currently
          deliver within the United Kingdom. Risk in the goods passes to you
          when they reach you (or someone you nominated accepts them).
        </p>
      </LegalSection>

      <LegalSection title="Cancellations & returns">
        <p>
          You can cancel any online order within 14 days of delivery for any
          reason, and send it back within a further 14 days — plus our own{" "}
          <Link href="/returns" className="text-ink underline underline-offset-4 hover:text-peach-deep">
            30-day returns promise
          </Link>{" "}
          for unworn items with tags on. Faulty goods get the full treatment
          under the Consumer Rights Act 2015 (30-day right to reject). Full
          mechanics, labels and refund timings live on the returns page.
        </p>
      </LegalSection>

      <LegalSection title="Warranty & liability">
        <p>
          We make pyjamas carefully and check every print, but we don&apos;t
          exclude or limit liability for death or personal injury caused by
          our negligence, for fraud, or for anything else UK law says
          can&apos;t be excluded. Beyond that, we&apos;re responsible for
          losses that were reasonably foreseeable when the contract was made —
          not for indirect losses we couldn&apos;t have predicted. Nothing in
          these terms limits your statutory consumer rights.
        </p>
      </LegalSection>

      <LegalSection title="Complaints">
        <p>
          Email {site.email} or call {site.phone} with your order reference
          and we&apos;ll respond within two working days — most things are
          sorted by the first reply. If we can&apos;t agree, UK consumers can
          take the claim to their local county court (small claims track),
          and we&apos;ll engage with any certified alternative-dispute
          resolution process we&apos;re signed up to at the time.
        </p>
      </LegalSection>

      <LegalSection title="Law & changes">
        <p>
          These terms are governed by the law of England and Wales; if
          you&apos;re a consumer living elsewhere in the UK, your local courts
          also have jurisdiction. We may update these terms for future
          orders — the date at the top shows the current version, and
          changes never apply backwards to an order already placed.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
