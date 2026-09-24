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
        <p className="text-[11.5px] font-semibold tracking-[0.2em] text-peach-deep uppercase">
          Storefront
        </p>
        <h1 className="mt-1.5 font-heading text-h3">Announcements</h1>
        <p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">
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
