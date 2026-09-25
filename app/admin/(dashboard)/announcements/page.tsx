import type { Metadata } from "next";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "@/lib/actions/announcements";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import { ListPagination, parsePage } from "@/components/admin/list-pagination";
import { getAdminAnnouncements } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Announcements",
  robots: { index: false, follow: false },
};

/** Rows per page of the announcements list. */
const PAGE_SIZE = 3;

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const all = await getAdminAnnouncements();
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const page = parsePage(typeof rawPage === "string" ? rawPage : undefined, totalPages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          These rotate in the scrolling marquee bar above the header. Keep each
          line under 160 characters — shorter reads better in motion.
        </p>
      </header>

      <AnnouncementsManager
        items={items}
        offset={(page - 1) * PAGE_SIZE}
        createAction={createAnnouncementAction}
        updateAction={updateAnnouncementAction}
        deleteAction={deleteAnnouncementAction}
      />

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/announcements"
      />
    </div>
  );
}
