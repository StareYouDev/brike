import type { Metadata } from "next";
import { createCollectionAction } from "@/lib/actions/collections";
import { CollectionForm } from "@/components/admin/collection-form";

export const metadata: Metadata = {
  title: "New collection",
  robots: { index: false, follow: false },
};

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Catalogue
        </p>
        <h1 className="mt-1.5 font-heading text-h3">New collection</h1>
      </header>

      <CollectionForm mode="create" action={createCollectionAction} />
    </div>
  );
}
