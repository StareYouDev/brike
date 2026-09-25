import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "BRIKE pyjama measurements — UK dress sizes, bust and waist guides plus kids' height charts.",
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

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb items={[{ label: "Size guide" }]} />

      <header className="mt-8 max-w-3xl">
        <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-line" aria-hidden />
          Find your fit
        </p>
        <h1 className="text-balance font-heading text-display-3">Size guide</h1>
        <p className="mt-4 text-[16px] text-foreground/80">
          Our pyjamas are cut for a relaxed fit — if you&apos;re between sizes,
          size down for a neater line or stay put for maximum cosiness. Inside
          leg on traditional pyjamas is 76 cm; waists are elasticated unless
          stated.
        </p>
      </header>

      <section className="mt-14 scroll-mt-40">
        <Reveal>
          <h2 className="font-heading text-h2">Adults</h2>
          <p className="mt-3 max-w-2xl text-[15.5px] text-foreground/75">
            Measure a pyjama top you already love flat on a table and compare
            the bust and waist below — all measurements are garment
            measurements, not body measurements.
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
                      <td
                        key={i}
                        className={`py-3 pr-4 ${i === 0 ? "font-medium" : "text-foreground/75"}`}
                      >
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

      <section className="mt-16 scroll-mt-40">
        <Reveal>
          <h2 className="font-heading text-h2">Kids</h2>
          <p className="mt-3 max-w-2xl text-[15.5px] text-foreground/75">
            Kids sizes follow height rather than age — measure from the crown
            to the sole without shoes on for the best match.
          </p>
          <div className="mt-6 overflow-x-auto">
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
                      <td
                        key={i}
                        className={`py-3 pr-4 ${i === 0 ? "font-medium" : "text-foreground/75"}`}
                      >
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

      <section className="mt-16 border-t border-border pt-10">
        <Reveal>
          <h2 className="font-heading text-h4">Still unsure?</h2>
          <p className="mt-3 max-w-2xl text-[15.5px] text-foreground/75">
            Send us your usual size and height and the studio team will point
            you at the right fit — we answer within one working day.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-block border-2 border-ink px-6 py-2.5 text-[12.5px] font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-cream"
          >
            Ask the studio
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
