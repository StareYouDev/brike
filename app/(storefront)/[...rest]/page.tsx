import { notFound } from "next/navigation";

/**
 * Root catch-all inside the storefront group: every URL not matched by a more
 * specific route (static > dynamic > catch-all) lands here, throws notFound()
 * and renders the group's designed 404 *with* storefront chrome.
 *
 * Precedence verified in the Next 16 router: /admin, /api/auth/*,
 * favicon/icon (static) all outrank this, and public/ assets (/prints/*.svg)
 * are resolved from the filesystem before app routes are matched.
 */
export default function UnknownRoutePage() {
  notFound();
}
