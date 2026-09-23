import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-logo text-[13px] tracking-[0.22em] text-peach-deep uppercase">
        Error 404
      </p>
      <h1 className="mt-4 font-heading text-display-3">Lost in the laundry</h1>
      <p className="mt-4 text-[16px] text-foreground/75">
        This page has wandered off with one of our socks. Let&apos;s get you back into
        something cosy.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="bg-ink px-7 py-3.5 text-[13px] font-semibold tracking-[0.16em] text-cream uppercase transition-colors hover:bg-peach-deep hover:text-ink"
        >
          Back home
        </Link>
        <Link
          href="/collections/new-in"
          className="border-2 border-ink px-7 py-3.5 text-[13px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-ink hover:text-cream"
        >
          Shop new in
        </Link>
      </div>
    </div>
  );
}
