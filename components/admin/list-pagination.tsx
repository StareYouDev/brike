import Link from "next/link";

/**
 * Prev/Next pager for the admin list pages. Datasets here are small, so the
 * pages fetch the full filtered list and slice it — this component only
 * renders the links. Page 1 is the canonical URL (no `?page=`); every other
 * query param (q/status) is carried through so filters survive paging.
 */
export function ListPagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalPages: number;
  /** e.g. "/admin/products" */
  basePath: string;
  /** Params to preserve, e.g. { q } or { status }. */
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const control = (kind: "prev" | "next") => {
    const target = kind === "prev" ? page - 1 : page + 1;
    const label = kind === "prev" ? "Previous page" : "Next page";
    const text = kind === "prev" ? "← Previous" : "Next →";
    const inRange = target >= 1 && target <= totalPages;
    if (!inRange) {
      return (
        <span
          aria-label={label}
          aria-disabled="true"
          className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-[13px] text-muted-foreground/50"
        >
          {text}
        </span>
      );
    }
    return (
      <Link
        href={hrefFor(target)}
        aria-label={label}
        className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-ink hover:bg-meta"
      >
        {text}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-[13px] text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {control("prev")}
        {control("next")}
      </div>
    </nav>
  );
}

/**
 * Clamp a `?page=` query string to a positive integer page within the
 * available range (out-of-range and garbage values fall back sanely).
 */
export function parsePage(raw: string | undefined, totalPages: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  const last = Math.max(totalPages, 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), last);
}
