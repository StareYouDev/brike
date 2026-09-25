"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Package,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/forms", label: "Forms", icon: FileText },
];

/**
 * BRIKE admin navigation (dashboard-01 structure, shadcn-neutral theme).
 * Ships only real destinations — no dead links. Pending cash-on-delivery
 * orders surface as a badge on the Orders entry; the active item picks up
 * the peach tint from --sidebar-accent.
 */
export function AdminSidebar({
  user,
  pendingOrders,
}: {
  user: { name: string; email: string };
  pendingOrders: number;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-baseline gap-2 px-2 py-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0">
          <span className="font-logo text-[18px] tracking-[0.16em] text-ink">
            BRIKE
          </span>
          <span className="text-[10px] font-semibold tracking-[0.24em] text-sidebar-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10.5px] font-semibold tracking-[0.2em] text-sidebar-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
            Manage
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className="h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.href === "/admin/orders" && pendingOrders > 0 ? (
                    <SidebarMenuBadge className="right-1.5 rounded-full bg-peach px-1.5 text-[10px] font-semibold text-ink group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:top-0.5">
                      {pendingOrders}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[13px] font-medium text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">
              {user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              <span className="group-data-[collapsible=icon]:sr-only">
                Sign out
              </span>
            </button>
          </form>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
