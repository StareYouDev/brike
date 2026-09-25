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
  title: "Returns & Refunds",
  description:
    "BRIKE's 30-day returns policy for UK orders, plus your statutory cancellation and consumer-rights rights — how to start a return and when you get your money back.",
};

/**
 * Returns policy (Trust bucket, Phase 4). Two layers, stated separately so
 * nothing here is narrower than UK law:
 * - our own 30-day promise (the generous one), and
 * - the statutory rights that apply on top of it — Consumer Rights Act 2015
 *   (faulty goods) and Consumer Contracts Regulations 2015 (14-day
 *   cancellation for distance sales).
 */
export default function ReturnsPage() {
  return (
    <LegalShell
      title="Returns & refunds"
      eyebrow="The fine print"
      intro="Changed your mind, or something isn't right? UK orders can be sent back within 30 days — and your statutory rights sit on top of that promise, never below it."
    >
      <LegalSection title="Our 30-day promise">
        <p>
          You have 30 days from the day your order arrives to send anything
          back for a full refund — no reason needed. Items just need to be
          unworn and unwashed, with the tags still attached and in their
          original packaging.
        </p>
        <LegalList
          items={[
            "Every box includes a prepaid return label — stick it on and hand the parcel to the carrier.",
            "Exchanges for a different size are free while stock lasts; we'll confirm availability before you post anything.",
            "Paid orders are refunded to the original payment method.",
            `Cash-on-delivery orders are refunded by bank transfer — we'll email you to arrange it.`,
          ]}
        />
      </LegalSection>

      <LegalSection title="Your statutory rights (UK law)">
        <p>
          The Consumer Contracts (Information, Cancellation and Additional
          Charges) Regulations 2015 give you 14 days from delivery to cancel
          any online order for any reason, and a further 14 days to send it
          back. You&apos;re entitled to a refund within 14 days of us
          receiving the goods back (or of you proving you posted them).
        </p>
        <p>
          Our 30-day promise is more generous than that 14-day window — where
          the two overlap, you always get the better deal.
        </p>
        <p>
          The Consumer Rights Act 2015 is separate and applies on top: goods
          must be as described, fit for purpose and of satisfactory quality.
          If they&apos;re faulty, you can reject them for a full refund within
          30 days of delivery. After 30 days we&apos;ll repair or replace
          first, with a price reduction or final right to reject if that
          fails.
        </p>
      </LegalSection>

      <LegalSection title="How to start a return">
        <LegalList
          items={[
            <>Email us at {site.email} or use the contact form with your order reference (BRK-XXXXXX) — keep this, it&apos;s how we find you fast.</>,
            "Pack the item with tags attached; the prepaid label in your box goes on the outside.",
            "Hand it to the carrier within 14 days of telling us you&apos;re returning (that keeps you fully within the statutory window).",
            "We inspect within 3–5 working days of arrival and email your refund — the statutory maximum is 14 days from the goods reaching us.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Faulty or damaged items">
        <p>
          Something arrive wrong, torn or not what you ordered? Email photos
          and your order reference within 48 hours of delivery and we&apos;ll
          sort a replacement or full refund — return postage is on us, and you
          keep your full statutory rights (including the 30-day right to
          reject faulty goods).
        </p>
      </LegalSection>

      <LegalSection title="What we can&apos;t take back">
        <p>
          For hygiene reasons we can&apos;t accept items that have been worn,
          washed or had their tags removed — get in touch before posting
          anything if you&apos;re unsure and we&apos;ll be honest with you.
          None of this limits your rights on faulty goods: those apply
          whatever the condition.
        </p>
      </LegalSection>

      <LegalSection title="Who we are">
        <TraderDetails />
        <p className="pt-2">
          Questions before you post something back?{" "}
          <Link href="/contact" className="text-ink underline underline-offset-4 hover:text-peach-deep">
            Contact the studio
          </Link>{" "}
          — we answer within one working day.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
