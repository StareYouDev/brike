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
        <h1 className="text-2xl font-semibold tracking-tight">New collection</h1>
      </header>

      <CollectionForm mode="create" action={createCollectionAction} />
    </div>
  );
}
