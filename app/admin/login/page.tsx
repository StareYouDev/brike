import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Real session check (proxy only looks at cookie presence). A valid
  // session skips the form; a forged/stale cookie simply renders it.
  const session = await auth();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-logo text-[26px] tracking-[0.18em] text-ink"
          >
            BRIKE
          </Link>
          <p className="mt-1 font-logo text-[11.5px] tracking-[0.24em] text-peach-deep uppercase">
            Admin
          </p>
        </div>

        <div className="border border-t-[3px] border-border border-t-peach-deep bg-background p-7 shadow-[0_18px_40px_-24px_rgba(29,29,27,0.35)]">
          <h1 className="font-heading text-h4">Sign in</h1>
          <p className="mt-1.5 mb-6 text-[13.5px] text-muted-foreground">
            Manage products, content and cash-on-delivery orders.
          </p>
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          Cash on delivery only — no online payments are ever taken.
        </p>
      </div>
    </div>
  );
}
