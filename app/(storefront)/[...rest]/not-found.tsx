import StorefrontNotFound from "../not-found";

/**
 * Same-segment not-found boundary for the root catch-all: notFound() thrown
 * by [...rest]/page.tsx is caught here, inside the storefront chrome.
 */
export default StorefrontNotFound;
