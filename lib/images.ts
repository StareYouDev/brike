/**
 * Pure image-URL helpers shared by server and client components.
 * Deliberately free of any database imports so client bundles stay clean.
 */
import type { Collection, Product } from "@/data/catalog";

/** Image URLs for a product: uploaded overrides, else generated SVG artwork. */
export function productImages(
  product: Pick<Product, "slug" | "imageA" | "imageB">,
): { a: string; b: string } {
  const a = product.imageA ?? `/prints/${product.slug}-a.svg`;
  const b = product.imageB ?? product.imageA ?? `/prints/${product.slug}-b.svg`;
  return { a, b };
}

/** Banner URL for a collection: uploaded override, else generated SVG artwork. */
export function collectionImage(
  collection: Pick<Collection, "slug" | "image">,
): string {
  return collection.image ?? `/prints/collection-${collection.slug}.svg`;
}
