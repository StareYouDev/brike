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
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      </header>

      <ProductForm
        mode="create"
        action={createProductAction}
        collections={collections.map(({ id, title }) => ({ id, title }))}
      />
    </div>
  );
}
