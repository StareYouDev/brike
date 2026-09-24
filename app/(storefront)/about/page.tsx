import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { Reveal } from "@/components/reveal";
import { site } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story behind BRIKE — a British boutique sleepwear house drawing every print by hand since 2003.",
};

const stats = [
  { value: "2003", label: "Founded in London" },
  { value: "100+", label: "Hand-drawn prints" },
  { value: "20%", label: "Kids profits donated" },
  { value: "4.9★", label: "Average review score" },
];

const steps = [
  {
    n: "01",
    title: "Painted by hand",
    body: "Every collection begins with gouache on paper — roses, hummingbirds, harlequin stars — painted at the studio table, never prompted from a machine.",
  },
  {
    n: "02",
    title: "Printed small-batch",
    body: "We print in short runs on combed cotton, brushed flannel, voile and gauze, so each drop stays special and waste stays low.",
  },
  {
    n: "03",
    title: "Cut for real life",
    body: "Elasticated waists, proper collars, roomy sleeves and pockets that actually hold a tissue — comfort first, always.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <Breadcrumb items={[{ label: "Our Story" }]} />
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-end">
          <Reveal>
            <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <span className="h-px w-8 bg-line" aria-hidden />
              Since 2003
            </p>
            <h1 className="text-balance font-heading text-display-3">
              A little house of hand-drawn pyjamas
            </h1>
            <p className="mt-6 max-w-xl text-lead text-foreground/80">
              {site.name} began with one woman, one sketchbook and a simple stubborn
              belief: the clothes you sleep in deserve the same care as the clothes you
              go out in.
            </p>
            <p className="mt-4 max-w-xl text-[15.5px] text-foreground/70">
              Two decades later we still draw every print by hand, still print in small
              batches, and still test every fabric against the same question — would you
              want to live in it on a Sunday?
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden bg-meta">
              <Image
                src="/prints/about.svg"
                alt="Hand-drawn floral artwork from the BRIKE studio"
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* stats */}
      <section className="mt-16 bg-peach">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-h2">{s.value}</p>
              <p className="mt-1 text-[13.5px] text-ink/75">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* process */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <Reveal>
          <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-px w-8 bg-line" aria-hidden />
            How it&apos;s made
          </p>
          <h2 className="max-w-2xl font-heading text-h2">From paintbrush to pillowcase</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div className="h-full border border-border p-7">
                <p className="font-logo text-[13px] tracking-[0.18em] text-peach-deep">
                  {step.n}
                </p>
                <h3 className="mt-3 font-heading text-h4">{step.title}</h3>
                <p className="mt-3 text-[15px] text-foreground/75">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* charity */}
      <section id="charity" className="relative overflow-hidden bg-navy">
        <Image
          src="/prints/charity.svg"
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="relative mx-auto grid max-w-[1400px] gap-8 px-6 py-16 md:py-20 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11.5px] font-semibold tracking-[0.22em] text-peach uppercase">
              The charity
            </p>
            <h2 className="mt-4 text-balance font-heading text-h2 text-cream">
              Pyjamas for small people, support for their grown-ups
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[16px] leading-relaxed text-cream/85">
              We donate {site.charityPercent}% of the profits from our Kids Collection
              to a UK charity providing respite care for families of children with
              complex needs. It started with a single donation in 2016 and has grown
              with every set sold — because bedtime should be the easiest part of the
              day for everyone.
            </p>
            <Link
              href="/collections/kids"
              className="mt-6 inline-block bg-peach px-7 py-3.5 text-[13px] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-cream"
            >
              Shop the kids collection
            </Link>
          </Reveal>
        </div>
      </section>

      {/* care */}
      <section id="care" className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <span className="h-px w-8 bg-line" aria-hidden />
              Fabric care
            </p>
            <h2 className="font-heading text-h2">Looking after your prints</h2>
            <p className="mt-5 max-w-lg text-[16px] text-foreground/80">
              Our cottons are pre-washed to minimise shrinkage, but a gentle habit keeps
              them soft for years:
            </p>
            <ul className="mt-5 space-y-2.5 text-[15.5px] text-foreground/75">
              <li>✦ Machine wash at 30° on a gentle cycle, inside out</li>
              <li>✦ Wash with similar colours — deep navy loves its own company</li>
              <li>✦ Warm iron on the reverse to protect the pigment</li>
              <li>✦ Skip the tumble dryer; line dry and they&apos;ll thank you</li>
              <li>✦ Brushed cotton softens with every single wash</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden bg-meta">
                <Image
                  src="/prints/celestial-harlequin-pyjama-set-a.svg"
                  alt="Celestial harlequin print"
                  fill
                  unoptimized
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden bg-meta">
                <Image
                  src="/prints/vintage-rose-cotton-pyjama-set-a.svg"
                  alt="Vintage rose print"
                  fill
                  unoptimized
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
