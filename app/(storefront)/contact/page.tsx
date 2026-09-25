import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { site } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Contact & Delivery",
  description: "Get in touch with BRIKE — delivery, returns and customer care.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb items={[{ label: "Contact" }]} />

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <Reveal>
          <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-px w-8 bg-line" aria-hidden />
            Say hello
          </p>
          <h1 className="text-balance font-heading text-display-3">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-4 max-w-lg text-[16px] text-foreground/80">
            Questions about sizes, prints or an order? The studio team answers every
            message within one working day.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-6">
            <div className="border border-border p-6">
              <h2 className="font-heading text-h5">Studio details</h2>
              <ul className="mt-4 space-y-3.5 text-[15px]">
                <li className="flex gap-3">
                  <Mail size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-peach-deep" />
                  <a href={`mailto:${site.email}`} className="hover:underline">
                    {site.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Phone size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-peach-deep" />
                  <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`} className="hover:underline">
                    {site.phone}
                  </a>
                </li>
                <li className="flex gap-3">
                  <MapPin size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-peach-deep" />
                  <span>{site.address}</span>
                </li>
              </ul>
            </div>
            <div className="border border-border p-6">
              <h2 className="font-heading text-h5">Customer care hours</h2>
              <dl className="mt-4 space-y-2 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/70">Monday – Thursday</dt>
                  <dd>9:00 – 17:30</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/70">Friday</dt>
                  <dd>9:00 – 16:00</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground/70">Weekends</dt>
                  <dd>Closed (we&apos;re asleep)</dd>
                </div>
              </dl>
            </div>
            <div className="bg-peach p-6">
              <h2 className="font-heading text-h5">Wholesale &amp; press</h2>
              <p className="mt-2 text-[14.5px] text-ink/80">
                Stocking BRIKE or writing about us? Choose “Wholesale” or “Press” in the
                form and we&apos;ll send line sheets and lookbooks.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* delivery */}
      <section id="delivery" className="mt-20 scroll-mt-40 border-t border-border pt-12">
        <Reveal>
          <h2 className="font-heading text-h2">Delivery &amp; returns</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Standard UK",
                p: `£${site.standardDelivery.toFixed(2)}`,
                d: "2–4 working days, tracked. Free on orders over £60.",
              },
              {
                t: "Express UK",
                p: "£5.95",
                d: "Next working day on orders placed before noon.",
              },
              {
                t: "Easy returns",
                p: "30 days",
                d: "Unworn sets with tags — prepaid label in every box.",
              },
            ].map((c) => (
              <div key={c.t} className="border border-border p-6">
                <p className="text-[11.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  {c.t}
                </p>
                <p className="mt-2 font-heading text-h4">{c.p}</p>
                <p className="mt-2 text-[14.5px] text-foreground/75">{c.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
