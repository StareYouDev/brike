import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { AddToCart } from "@/components/add-to-cart";
import {
  ColorwayProvider,
  ProductGallery,
} from "@/components/colorway-picker";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatPrice } from "@/data/catalog";
import {
  getAllCollections,
  getAllProducts,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/queries";
import { productImages } from "@/lib/images";

const reviewDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getAllProducts()).find((p) => p.slug === slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: productImages(product).a, width: 600, height: 750 }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [allProducts, allCollections] = await Promise.all([
    getAllProducts(),
    getAllCollections(),
  ]);
  const product = allProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const primaryCollection = allCollections.find(
    (c) => c.slug === product.collections[0],
  );
  const related = getRelatedProducts(product, allProducts, 4);
  const onSale = typeof product.compareAt === "number";
  const images = productImages(product);

  const reviews = await getProductReviews(slug);
  // Merged summary: the seeded baseline (rating + count) plus everything
  // posted through the review form, so the header matches the list below.
  const reviewCount = product.reviews + reviews.length;
  const avgRating =
    reviewCount > 0
      ? (product.rating * product.reviews +
          reviews.reduce((sum, r) => sum + r.rating, 0)) /
        reviewCount
      : 0;

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

      <ColorwayProvider colorways={product.colorways}>
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* gallery — follows the colour selected in the buy panel */}
          <ProductGallery
            name={product.name}
            badge={product.badge ?? null}
            images={images}
          />

          {/* details */}
        <div className="lg:sticky lg:top-40 lg:self-start">
          <p className="text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {product.fabric} · {product.style}
          </p>
          <h1 className="mt-2.5 text-balance font-heading text-h1">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars rating={avgRating} />
            <a
              href="#reviews"
              className="text-[13.5px] text-muted-foreground underline underline-offset-2 hover:text-ink"
            >
              {avgRating.toFixed(1)} · {reviewCount} review
              {reviewCount === 1 ? "" : "s"}
            </a>
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
      </ColorwayProvider>

      {/* reviews — seeded baseline + everything posted below */}
      <section id="reviews" className="mt-20 scroll-mt-40">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2.5 flex items-center gap-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              <span className="h-px w-8 bg-line" aria-hidden />
              Reviews
            </p>
            <h2 className="font-heading text-h2">What everyone says</h2>
          </div>
          <div className="flex items-center gap-3">
            <Stars rating={avgRating} />
            <span className="text-[14px] text-muted-foreground">
              {avgRating.toFixed(1)} · {reviewCount} review
              {reviewCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <ReviewForm slug={product.slug} />

          <div>
            {reviews.length === 0 ? (
              <div className="flex h-full min-h-40 flex-col items-start justify-center border border-dashed border-border p-6">
                <p className="font-heading text-h5">No reviews yet</p>
                <p className="mt-2 text-[14.5px] text-muted-foreground">
                  Be the first — stars and a line about the fit help everyone
                  else choose.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {reviews.map((review) => (
                  <li key={review.id} className="py-5 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[15px] font-medium">{review.author}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[12.5px] text-muted-foreground">
                          {reviewDateFormatter.format(review.createdAt)}
                        </span>
                        <Stars rating={review.rating} />
                      </div>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
                      {review.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

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
