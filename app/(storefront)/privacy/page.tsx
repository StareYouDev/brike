import type { Metadata } from "next";
import {
  LegalList,
  LegalSection,
  LegalShell,
  TraderDetails,
} from "@/components/legal";
import { site } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How BRIKE collects, uses and protects your personal data under UK GDPR — what we hold for orders, newsletters and reviews, who we share it with, how long we keep it, and your rights.",
};

/**
 * Privacy notice (Trust bucket, Phase 4). Written for this shop's REAL data
 * flows — no boilerplate about analytics we don't run: orders + contact
 * messages + newsletter emails + reviews, processed by Vercel/Neon/Resend,
 * essential cookies only (admin session + local basket). Legal bases named
 * per purpose, UK GDPR rights + ICO escalation, 6-year HMRC retention.
 */
export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      eyebrow="The fine print"
      intro="What we collect, why we're allowed to, who touches it, and how long we keep it — written for this shop, not copied from a template. Under UK GDPR you're the data subject and we're the controller."
    >
      <LegalSection title="Who we are">
        <TraderDetails />
        <p>
          For data-protection purposes we&apos;re the controller of the
          personal data described below. Our data-protection contact is the
          same as our general contact: {site.email}.
        </p>
      </LegalSection>

      <LegalSection title="What we collect, and where it comes from">
        <p>You give us this directly when you use the site:</p>
        <LegalList
          items={[
            <>
              <strong>Orders</strong> — name, email, phone, delivery address,
              the items themselves and any notes you add. Payment is cash on
              delivery, so we never see or store card details.
            </>,
            <>
              <strong>Contact form messages</strong> — your email and whatever
              you write to us.
            </>,
            <>
              <strong>Newsletter sign-up</strong> — your email address, plus a
              record of whether you&apos;ve used a welcome code.
            </>,
            <>
              <strong>Reviews</strong> — the display name you choose and your
              comment (publicly visible on the product page).
            </>,
            <>
              <strong>Security data</strong> — your IP address, used
              briefly by our rate-limits to block bots and abuse. It&apos;s a
              counter, not a profile.
            </>,
          ]}
        />
        <p>
          We also store a small basket in your browser&apos;s local storage so
          it survives page refreshes — that never leaves your device.
        </p>
      </LegalSection>

      <LegalSection title="Why we use it (and our lawful basis)">
        <LegalList
          items={[
            <>
              <strong>To fulfil your order and handle returns</strong> —
              contract necessity. Without name, address and phone there is no
              delivery.
            </>,
            <>
              <strong>To answer your messages</strong> — contract (before an
              order) or our legitimate interest in running a shop people can
              actually reach.
            </>,
            <>
              <strong>To send the newsletter and welcome code</strong> — your
              consent, given when you submit the form. Every email has an
              unsubscribe (or just reply &quot;unsubscribe&quot;) and consent
              is as easy to withdraw as to give.
            </>,
            <>
              <strong>To keep the site secure</strong> — legitimate interest
              in blocking fraud, bots and abuse.
            </>,
            <>
              <strong>Accounting records</strong> — legal obligation; UK tax
              law requires us to keep transaction records.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>
          We don&apos;t sell, rent or trade your data — ever. We share only
          what&apos;s necessary with the handful of service providers that run
          the shop, each bound by data-protection contracts:
        </p>
        <LegalList
          items={[
            "Our hosting and database providers (Vercel and Neon), which store the orders and pages themselves.",
            "Our transactional-email provider (Resend), which sends your order confirmation, dispatch notice and welcome code.",
            "Our delivery partners, which need the address and phone number to hand you the parcel.",
          ]}
        />
        <p>
          Some of these process data outside the UK. When they do, transfers
          are protected by UK adequacy regulations or the UK International
          Data Transfer Agreement, as applicable.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <LegalList
          items={[
            "Orders and invoices: 6 years, because UK tax law requires it.",
            "Contact messages: up to 2 years after we finish the conversation.",
            "Newsletter emails: until you unsubscribe, plus a minimal suppression entry so we never re-add you.",
            "Reviews: until you ask us to remove them.",
            "Rate-limit counters: short-lived, then deleted automatically.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          This site runs on essential cookies only: the sign-in cookie that
          keeps the admin area secure, and the local basket mentioned above.
          There are no advertising or analytics cookies, so there&apos;s no
          cookie banner to click through — if we ever add non-essential
          cookies, we&apos;ll ask first and update this page.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Under UK GDPR you can ask us to: access a copy of your data, correct
          it, delete it, restrict how we use it, hand it to another provider
          (portability), or object to our use. Where processing runs on
          consent, you can withdraw it at any time. Email {site.email} — we
          respond within one month, free of charge.
        </p>
        <p>
          If we ever get it wrong, you can complain to the Information
          Commissioner&apos;s Office: ico.org.uk or 0303 123 1113. We&apos;d
          appreciate the chance to put it right first, though.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          When what we collect or why changes, this page changes with it — the
          &quot;last updated&quot; date at the top tells you when that
          happened. Significant changes to newsletter or order data will be
          called out on the site itself.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
