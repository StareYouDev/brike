import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import {
  getAllCollections,
  getAllProducts,
  getAnnouncements,
} from "@/lib/queries";

/**
 * Storefront chrome (header/search/announcement bar, footer, cart drawer).
 * Only routes inside the (storefront) group get it — /admin stays chrome-free,
 * and the group's not-found.tsx renders the designed 404 *with* this chrome.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [announcements, products, collections] = await Promise.all([
    getAnnouncements(),
    getAllProducts(),
    getAllCollections(),
  ]);
  return (
    <>
      <SiteHeader
        data={{
          announcements,
          searchProducts: products,
          searchCollections: collections.map(({ slug, title }) => ({
            slug,
            title,
          })),
        }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
