import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_SELECT, getUsers, type BookingRow } from "@/lib/admin-data";
import { fmtDate, inr } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-deep">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function Dashboard() {
  const admin = createAdminClient();
  const [users, pgsRes, collegesRes, bookingsRes] = await Promise.all([
    getUsers(),
    admin.from("pgs").select("id, is_active"),
    admin.from("colleges").select("id", { count: "exact", head: true }),
    admin.from("bookings").select(BOOKING_SELECT).order("created_at", { ascending: false }),
  ]);

  const pgs = pgsRes.data ?? [];
  const bookings = (bookingsRes.data ?? []) as unknown as BookingRow[];
  const paid = bookings.filter((b) => b.status === "paid");
  const revenue = paid.reduce((sum, b) => sum + b.amount_inr, 0);
  const names = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-deep">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Registered users" value={users.length} />
        <Stat label="PGs & hostels" value={pgs.length} hint={`${pgs.filter((p) => p.is_active).length} visible to the public`} />
        <Stat label="Colleges" value={collegesRes.count ?? 0} />
        <Stat label="Payments received" value={inr(revenue)} hint={`${paid.length} paid bookings`} />
        <Stat label="Pending payments" value={bookings.filter((b) => b.status === "pending").length} />
        <Stat label="Failed payments" value={bookings.filter((b) => b.status === "failed").length} />
        <Stat label="Current residents" value={bookings.filter((b) => b.moved_in).length} hint="Marked as moved in" />
        <Stat label="All bookings" value={bookings.length} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold text-deep">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-brand hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
              <tr><th className="p-3">Person</th><th className="p-3">PG</th><th className="p-3">Visit</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {bookings.slice(0, 8).map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="p-3">{names.get(b.user_id)?.name ?? "Unknown"}<div className="text-xs text-slate-500">{names.get(b.user_id)?.email}</div></td>
                  <td className="p-3">{b.pgs?.name ?? "-"}</td>
                  <td className="p-3">{fmtDate(b.visit_date)}</td>
                  <td className="p-3">{inr(b.amount_inr)}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
