import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { site } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Contact & Delivery",
  description: "Get in touch with BRIKE — delivery, returns, size guide and customer care.",
};

const sizeRows = [
  ["XS", "UK 6–8", "80–84 cm", "62–66 cm"],
  ["S", "UK 8–10", "84–88 cm", "66–70 cm"],
  ["M", "UK 10–12", "88–94 cm", "70–76 cm"],
  ["L", "UK 12–14", "94–100 cm", "76–82 cm"],
  ["XL", "UK 14–16", "100–106 cm", "82–88 cm"],
  ["XXL (men’s)", "UK 16–18", "106–112 cm", "88–94 cm"],
];

const kidsRows = [
  ["2–3Y", "92–98 cm", "50–52 cm"],
  ["4–5Y", "104–110 cm", "53–55 cm"],
  ["6–7Y", "116–122 cm", "56–58 cm"],
  ["8–9Y", "128–134 cm", "60–63 cm"],
  ["10–11Y", "140–146 cm", "65–68 cm"],
];

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

      {/* size guide */}
      <section id="size-guide" className="mt-16 scroll-mt-40">
        <Reveal>
          <h2 className="font-heading text-h2">Size guide</h2>
          <p className="mt-3 max-w-2xl text-[15.5px] text-foreground/75">
            Our pyjamas are cut for a relaxed fit — if you&apos;re between sizes, size
            down for a neater line or stay put for maximum cosiness. Inside leg on
            traditional pyjamas is 76 cm; waists are elasticated unless stated.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="py-3 pr-4 font-semibold">Size</th>
                  <th className="py-3 pr-4 font-semibold">UK dress size</th>
                  <th className="py-3 pr-4 font-semibold">Bust / chest</th>
                  <th className="py-3 font-semibold">Waist</th>
                </tr>
              </thead>
              <tbody>
                {sizeRows.map((row) => (
                  <tr key={row[0]} className="border-b border-border">
                    {row.map((cell, i) => (
                      <td key={i} className={`py-3 pr-4 ${i === 0 ? "font-medium" : "text-foreground/75"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="py-3 pr-4 font-semibold">Kids size</th>
                  <th className="py-3 pr-4 font-semibold">Height</th>
                  <th className="py-3 font-semibold">Chest</th>
                </tr>
              </thead>
              <tbody>
                {kidsRows.map((row) => (
                  <tr key={row[0]} className="border-b border-border">
                    {row.map((cell, i) => (
                      <td key={i} className={`py-3 pr-4 ${i === 0 ? "font-medium" : "text-foreground/75"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
