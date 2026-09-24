import type { Metadata } from "next";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "@/lib/actions/announcements";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import { getAdminAnnouncements } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Announcements",
  robots: { index: false, follow: false },
};

export default async function AdminAnnouncementsPage() {
  const items = await getAdminAnnouncements();

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
        createAction={createAnnouncementAction}
        updateAction={updateAnnouncementAction}
        deleteAction={deleteAnnouncementAction}
      />
    </div>
  );
}
