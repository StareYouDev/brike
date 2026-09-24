import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { parseUuid } from "@/lib/admin-auth";
import { getAdminCollections, getAdminProduct } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uuid = parseUuid(id);
  const [product, collections] = await Promise.all([
    uuid ? getAdminProduct(uuid) : Promise.resolve(null),
    getAdminCollections(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Catalogue
        </p>
        <h1 className="mt-1.5 font-heading text-h3">Edit product</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          {product.name} · /products/{product.slug}
        </p>
      </header>

      <ProductForm
        mode="edit"
        action={updateProductAction.bind(null, product.id)}
        collections={collections.map(({ id: cid, title }) => ({
          id: cid,
          title,
        }))}
        initial={product}
      />
    </div>
  );
}
