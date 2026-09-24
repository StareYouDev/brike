"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Sticky top bar: sidebar toggle, brand mark, and a way back to the shop. */
export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-ink/10 bg-cream/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1.5" />
      <span aria-hidden className="h-4 w-px bg-ink/15" />
      <span className="font-logo text-[13px] tracking-[0.18em] text-ink uppercase">
        BRIKE Admin
      </span>
      <Link
        href="/"
        className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Store size={14} aria-hidden />
        View store
      </Link>
    </header>
  );
}
