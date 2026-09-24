import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { CollectionView } from "@/components/collection-view";
import { Reveal } from "@/components/reveal";
import { getAllCollections, getAllProducts, getCollectionProducts } from "@/lib/queries";
import { collectionImage } from "@/lib/images";

export async function generateStaticParams() {
  const collections = await getAllCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collections = await getAllCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) return { title: "Collection not found" };
  return { title: collection.title, description: collection.description };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collections = await getAllCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();
  const items = getCollectionProducts(await getAllProducts(), slug);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-8 pb-20">
      <Breadcrumb items={[{ label: "Shop", href: "/collections/new-in" }, { label: collection.title }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end">
        <Reveal y={24}>
          <div>
            <p className="mb-3 text-[11.5px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {items.length} styles
            </p>
            <h1 className="text-balance font-heading text-display-3">{collection.title}</h1>
            <p className="mt-4 max-w-xl text-lead text-foreground/80">
              {collection.description
                ? collection.description
                : `Shop ${collection.title} — print-led pyjamas and nightwear from BRIKE.`}
            </p>
          </div>
        </Reveal>
        <Reveal y={24} delay={0.1}>
          <div className="relative aspect-[16/9] overflow-hidden bg-meta">
            <Image
              src={collectionImage(collection)}
              alt={collection.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-12">
        <Suspense fallback={null}>
          <CollectionView products={items} />
        </Suspense>
      </div>
    </div>
  );
}
