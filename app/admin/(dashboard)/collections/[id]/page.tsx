import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateCollectionAction } from "@/lib/actions/collections";
import { CollectionForm } from "@/components/admin/collection-form";
import { parseUuid } from "@/lib/admin-auth";
import { getAdminCollection } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit collection",
  robots: { index: false, follow: false },
};

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uuid = parseUuid(id);
  const collection = uuid ? await getAdminCollection(uuid) : null;
  if (!collection) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit collection</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {collection.title} · /collections/{collection.slug}
        </p>
      </header>

      <CollectionForm
        mode="edit"
        action={updateCollectionAction.bind(null, collection.id)}
        initial={collection}
      />
    </div>
  );
}
