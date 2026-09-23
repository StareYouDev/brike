import Link from "next/link";
import Image from "next/image";
import { ArrowRight, PencilRuler, HeartHandshake, Sparkles } from "lucide-react";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { Stars } from "@/components/stars";
import { collections, products, reviews, site } from "@/data/catalog";

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2.5 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          <span className="h-px w-8 bg-line" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="font-heading text-h2">{title}</h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="group flex items-center gap-1.5 pb-1.5 text-[13.5px] font-medium tracking-[0.1em] uppercase"
        >
          {linkLabel}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

const shopTiles = ["womens", "kids", "mens", "festive"]
  .map((slug) => collections.find((c) => c.slug === slug)!)
  .filter(Boolean);

const newIn = products.filter((p) => p.collections.includes("new-in")).slice(0, 4);
const bestSellers = products
  .filter((p) => p.collections.includes("best-sellers"))
  .slice(0, 4);

const marqueeWords = [
  "Hand-drawn prints",
  "Super-soft cotton",
  "Designed in London",
  "Small-batch drops",
  "Matching family sets",
];

function MarqueeBand() {
  const group = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {marqueeWords.map((w) => (
        <span
          key={w}
          className="flex items-center gap-12 whitespace-nowrap font-heading text-h4 italic"
        >
          {w}
          <span aria-hidden className="text-ink/45 not-italic">
            ✦
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden border-y border-ink/10 bg-peach py-5">
      <div className="marquee-track" style={{ ["--marquee-duration" as string]: "34s" }}>
        {group}
        {group}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      {/* shop by category */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <SectionHeading eyebrow="Start here" title="Shop the collections" href="/collections/new-in" linkLabel="View all" />
        <Reveal stagger={0.09}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {shopTiles.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-meta">
                <Image
                  src={`/prints/collection-${c.slug}.svg`}
                  alt={c.title}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
                  <span className="font-heading text-[22px] leading-tight text-cream md:text-h5">
                    {c.shortTitle}
                  </span>
                  <span className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* new in */}
      <section className="mx-auto max-w-[1400px] px-6 pb-16 md:pb-20">
        <SectionHeading eyebrow="Fresh off the drawing board" title="New in" href="/collections/new-in" linkLabel="Shop new in" />
        <Reveal stagger={0.08}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {newIn.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i < 2} />
            ))}
          </div>
        </Reveal>
      </section>

      <MarqueeBand />

      {/* story */}
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal y={40}>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-meta">
              <Image
                src="/prints/about.svg"
                alt="Hand-drawn floral print surrounding an arched window"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-3 -bottom-6 bg-peach px-6 py-4 md:-right-6">
              <p className="font-logo text-[13px] tracking-[0.14em] uppercase">Est. 2003 · London</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            <span className="h-px w-8 bg-line" aria-hidden />
            Our story
          </p>
          <h2 className="text-balance font-heading text-h2">
            Drawn by hand, worn on slow mornings
          </h2>
          <p className="mt-5 max-w-lg text-lead text-foreground/80">
            Every BRIKE print starts as paint on paper — hummingbirds, vintage roses,
            celestial harlequins — before it ever becomes fabric. We print in small
            batches on super-soft cottons, then cut and finish each set for the kind of
            comfort you feel the moment you put it on.
          </p>
          <p className="mt-4 max-w-lg text-[15.5px] text-foreground/70">
            Female-founded, proudly British, and still drawing every collection by hand
            in our East London studio.
          </p>
          <Link
            href="/about"
            className="group mt-8 inline-flex items-center gap-2 border-2 border-ink px-7 py-3.5 text-[13px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-ink hover:text-cream"
          >
            Read our story
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      {/* charity */}
      <section className="relative overflow-hidden bg-navy">
        <Image
          src="/prints/charity.svg"
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 text-center md:py-20">
          <Reveal>
            <p className="text-[11.5px] font-semibold tracking-[0.22em] text-peach uppercase">
              Giving back
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-balance font-heading text-h2 text-cream">
              {site.charityPercent}% of our kids’ profits go to our chosen charity
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] text-cream/80">
              Pyjamas for small people, support for the people who look after them.
              Every kids’ set helps fund respite care for families across the UK.
            </p>
            <Link
              href="/about"
              className="mt-7 inline-block bg-peach px-7 py-3.5 text-[13px] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-cream"
            >
              How it works
            </Link>
          </Reveal>
        </div>
      </section>

      {/* best sellers */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <SectionHeading eyebrow="Loved by hundreds" title="Best sellers" href="/collections/best-sellers" linkLabel="Shop best sellers" />
        <Reveal stagger={0.08}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* values */}
      <section className="border-y border-border bg-meta">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-14 md:grid-cols-3">
          {[
            {
              icon: PencilRuler,
              title: "Drawn, not generated",
              body: "Every motif is painted by hand in our studio before it becomes a print.",
            },
            {
              icon: Sparkles,
              title: "Properly soft fabric",
              body: "Combed cotton, brushed flannel and airy voile — tested wash after wash.",
            },
            {
              icon: HeartHandshake,
              title: "20% kids give-back",
              body: "A fifth of kids’ profits funds respite care for families across the UK.",
            },
          ].map((v) => (
            <div key={v.title} className="flex gap-4">
              <v.icon size={26} strokeWidth={1.4} className="mt-0.5 shrink-0 text-peach-deep" />
              <div>
                <h3 className="font-heading text-h5">{v.title}</h3>
                <p className="mt-1.5 text-[14.5px] text-foreground/75">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* reviews */}
      <section className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
        <SectionHeading eyebrow="From the washing basket" title="What you say" />
        <Reveal stagger={0.1}>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="flex flex-col border border-border bg-white p-7">
                <Stars rating={r.rating} className="text-[15px]" />
                <blockquote className="mt-4 flex-1 font-heading text-[19px] leading-snug italic">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4 text-[13.5px]">
                  <span className="font-semibold">{r.name}</span>
                  <span className="block text-muted-foreground">{r.product}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
