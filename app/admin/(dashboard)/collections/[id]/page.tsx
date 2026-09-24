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
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Catalogue
        </p>
        <h1 className="mt-1.5 font-heading text-h3">Edit collection</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
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
