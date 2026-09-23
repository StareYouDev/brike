import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { Stars } from "@/components/stars";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  formatPrice,
  getCollection,
  getProduct,
  getRelatedProducts,
  products,
} from "@/data/catalog";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: `/prints/${product.slug}-a.svg`, width: 600, height: 750 }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const primaryCollection = getCollection(product.collections[0]);
  const related = getRelatedProducts(product, 4);
  const onSale = typeof product.compareAt === "number";

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb
        items={[
          ...(primaryCollection
            ? [{ label: primaryCollection.title, href: `/collections/${primaryCollection.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-meta">
            <Image
              src={`/prints/${product.slug}-a.svg`}
              alt={`${product.name} — ${product.colorways[0]}`}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            {product.badge ? (
              <span className="absolute top-4 left-4 rounded-full bg-ink px-3.5 py-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-cream uppercase">
                {product.badge}
              </span>
            ) : null}
          </div>
          <div className="flex gap-3 lg:flex-col">
            {(["a", "b"] as const).map((variant, i) => (
              <div
                key={variant}
                className="relative aspect-square w-1/3 shrink-0 overflow-hidden bg-meta lg:aspect-[4/5] lg:w-24"
              >
                <Image
                  src={`/prints/${product.slug}-${variant}.svg`}
                  alt={`${product.name} — ${product.colorways[i] ?? product.colorways[0]}`}
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* details */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <p className="text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {product.fabric} · {product.style}
          </p>
          <h1 className="mt-2.5 text-balance font-heading text-h1">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars rating={product.rating} />
            <span className="text-[13.5px] text-muted-foreground">
              {product.rating.toFixed(1)} · {product.reviews} reviews
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className={`text-[26px] font-semibold ${onSale ? "text-sale" : ""}`}>
              {formatPrice(product.price)}
            </span>
            {onSale ? (
              <>
                <span className="text-[17px] text-muted-foreground line-through">
                  {formatPrice(product.compareAt!)}
                </span>
                <span className="rounded-full bg-sale/10 px-3 py-1 text-[12px] font-semibold text-sale">
                  Save {formatPrice(product.compareAt! - product.price)}
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-foreground/80">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <Accordion type="multiple" defaultValue={["description"]} className="mt-9 border-t border-border">
            <AccordionItem value="description">
              <AccordionTrigger className="text-[13.5px] font-semibold tracking-[0.12em] uppercase">
                Description &amp; details
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-[15px] text-foreground/80">
                  {product.details.map((d) => (
                    <li key={d} className="flex gap-2.5">
                      <span aria-hidden className="text-peach-deep">
                        ✦
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-[13.5px] font-semibold tracking-[0.12em] uppercase">
                Fabric &amp; care
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-[15px] text-foreground/80">
                  Machine wash cold on a gentle cycle with like colours. Warm iron on the
                  reverse to keep the print vivid. Do not tumble dry — natural fibres dry
                  quickly on the line anyway.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger className="text-[13.5px] font-semibold tracking-[0.12em] uppercase">
                Delivery &amp; returns
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-[15px] text-foreground/80">
                  £3.95 standard UK delivery (2–4 working days), free over £60. Easy
                  30-day returns on unworn sets with tags attached — we include a prepaid
                  label with every order.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2.5 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                <span className="h-px w-8 bg-line" aria-hidden />
                Keep browsing
              </p>
              <h2 className="font-heading text-h2">You may also like</h2>
            </div>
          </div>
          <Reveal stagger={0.08}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}
    </div>
  );
}
