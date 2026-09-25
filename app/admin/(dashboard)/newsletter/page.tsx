import type { Metadata } from "next";
import { getAdminDiscountCodes, getAdminSubscribers } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Newsletter",
  robots: { index: false, follow: false },
};

/** Latest sign-ups shown on the page (the header states the full count). */
const SUBSCRIBERS_SHOWN = 100;

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Read-only newsletter board: who's on the list and how the discount codes
 * are doing. Sign-ups arrive from the footer form (subscribeAction); the
 * WELCOME10 code is seeded idempotently by lib/db/seed.ts.
 */
export default async function AdminNewsletterPage() {
  const [{ items, total }, codes] = await Promise.all([
    getAdminSubscribers(SUBSCRIBERS_SHOWN),
    getAdminDiscountCodes(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Newsletter</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Footer sign-ups land here. Each email can redeem a code once — the
          counters below update as orders come in.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Discount codes</h2>
          <span className="text-[13px] text-muted-foreground">
            {codes.length} code{codes.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[12.5px] text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Redemptions</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-semibold tracking-[0.08em]">
                    {code.code}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {code.percentOff}% off
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {code.redemptionsCount}
                    {code.maxRedemptions !== null
                      ? ` of ${code.maxRedemptions}`
                      : ""}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        code.active
                          ? "rounded-full bg-forest/10 px-2.5 py-0.5 text-[12px] font-medium text-forest"
                          : "rounded-full bg-meta px-2.5 py-0.5 text-[12px] text-muted-foreground"
                      }
                    >
                      {code.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {code.expiresAt ? dateFmt.format(code.expiresAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Subscribers</h2>
          <span className="text-[13px] text-muted-foreground">
            {total} total{total > items.length ? ` · showing latest ${items.length}` : ""}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No subscribers yet — the footer sign-up lands here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[12.5px] text-muted-foreground uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3">{sub.email}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {sub.source}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">
                      {dateFmt.format(sub.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
