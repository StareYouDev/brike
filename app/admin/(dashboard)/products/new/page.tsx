import type { Metadata } from "next";
import { createProductAction } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminCollections } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const collections = await getAdminCollections();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Catalogue
        </p>
        <h1 className="mt-1.5 font-heading text-h3">New product</h1>
      </header>

      <ProductForm
        mode="create"
        action={createProductAction}
        collections={collections.map(({ id, title }) => ({ id, title }))}
      />
    </div>
  );
}
