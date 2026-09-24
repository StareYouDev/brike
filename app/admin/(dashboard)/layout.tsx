import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut, Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";

/**
 * Admin shell + guard. proxy.ts already bounced cookie-less requests; auth()
 * here validates the JWT itself, so a forged cookie can never reach the
 * dashboard (worst case: proxy passes → this redirects to /admin/login,
 * which the proxy never redirects — no loop).
 *
 * Phase 2 ships only real destinations (no dead links); CRUD sections
 * (products, collections, announcements, orders) join the nav in phase 3.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-4 border-b border-white/10 bg-ink px-4 py-3 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-6 md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="flex items-baseline gap-2 md:block">
          <span className="font-logo text-[20px] tracking-[0.16em] text-cream">
            BRIKE
          </span>
          <span className="text-[10px] font-semibold tracking-[0.24em] text-peach uppercase md:mt-1 md:block">
            Admin
          </span>
        </div>

        <nav
          aria-label="Admin"
          className="flex flex-1 flex-row gap-1 md:flex-none md:flex-col"
        >
          <Link
            href="/admin"
            aria-current="page"
            className="flex items-center gap-2.5 rounded-md bg-white/10 px-3 py-2 text-[13.5px] font-medium text-cream"
          >
            <LayoutDashboard size={16} aria-hidden />
            Overview
          </Link>
        </nav>

        <div className="flex flex-row items-center gap-1 md:mt-auto md:flex-col md:items-stretch">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] text-cream/70 transition-colors hover:bg-white/10 hover:text-cream"
          >
            <Store size={16} aria-hidden />
            View store
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] text-cream/70 transition-colors hover:bg-white/10 hover:text-cream"
            >
              <LogOut size={16} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 bg-cream">
        <main className="mx-auto w-full max-w-6xl px-5 py-7 md:px-8 md:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
