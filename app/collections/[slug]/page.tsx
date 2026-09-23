import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { CollectionView } from "@/components/collection-view";
import { Reveal } from "@/components/reveal";
import { collections, getCollection, getCollectionProducts } from "@/data/catalog";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return { title: collection.title, description: collection.description };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const items = getCollectionProducts(slug);

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
              {collection.description}
            </p>
          </div>
        </Reveal>
        <Reveal y={24} delay={0.08}>
          <div className="relative aspect-[16/7] overflow-hidden bg-meta">
            <Image
              src={`/prints/collection-${collection.slug}.svg`}
              alt=""
              aria-hidden
              fill
              unoptimized
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-10">
        <Suspense fallback={null}>
          <CollectionView products={items} />
        </Suspense>
      </div>
    </div>
  );
}
