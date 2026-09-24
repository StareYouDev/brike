import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { getPendingOrderCount } from "@/lib/queries";

/**
 * Admin shell + guard. proxy.ts already bounced cookie-less requests; auth()
 * here validates the JWT itself, so a forged cookie can never reach the
 * dashboard (worst case: proxy passes → this redirects to /admin/login,
 * which the proxy never redirects — no loop).
 *
 * Phase 3: dashboard-01's SidebarProvider/AppSidebar/SidebarInset structure.
 * Phase 5 restyle: shadcn-neutral surfaces (--background/--card) with peach as
 * the only accent, via .admin-theme (app/globals.css).
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const pendingOrders = await getPendingOrderCount();

  return (
    <div className="admin-theme min-h-svh bg-background">
      {/* Sidebar tooltips (SidebarMenuButton `tooltip` prop) require a
          Radix TooltipProvider somewhere above them. */}
      <TooltipProvider>
        <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AdminSidebar
          user={{
            name: session.user?.name ?? "Admin",
            email: session.user?.email ?? "",
          }}
          pendingOrders={pendingOrders}
        />
        <SidebarInset className="bg-background">
          <AdminHeader />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
