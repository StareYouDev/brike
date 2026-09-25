import type { Metadata } from "next";
import { FormsManager } from "@/components/admin/forms-manager";
import { getFormSettings } from "@/lib/form-settings";

export const metadata: Metadata = {
  title: "Forms",
  robots: { index: false, follow: false },
};

export default async function AdminFormsPage() {
  const [contact, checkout] = await Promise.all([
    getFormSettings("contact"),
    getFormSettings("checkout"),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Customise what the contact and checkout pages say. Changes take
          effect across the storefront as soon as you save — no deploy needed.
        </p>
      </header>

      <FormsManager contact={contact} checkout={checkout} />
    </div>
  );
}
