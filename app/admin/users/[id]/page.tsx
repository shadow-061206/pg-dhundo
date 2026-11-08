import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_SELECT, type BookingRow } from "@/lib/admin-data";
import { fmtDate, inr } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: res } = await admin.auth.admin.getUserById(id);
  const user = res?.user;
  if (!user) notFound();

  const { data } = await admin.from("bookings").select(BOOKING_SELECT).eq("user_id", id).order("created_at", { ascending: false });
  const bookings = (data ?? []) as unknown as BookingRow[];
  const paid = bookings.filter((b) => b.status === "paid");

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm font-semibold text-brand hover:underline">← All users</Link>
      <header className="rounded-xl border border-line bg-white p-5">
        <h1 className="text-xl font-extrabold text-deep">{(user.user_metadata?.full_name as string) || user.email}</h1>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Email</dt><dd>{user.email}</dd></div>
          <div><dt className="text-slate-500">Phone (last booking)</dt><dd>{bookings[0]?.phone ?? "-"}</dd></div>
          <div><dt className="text-slate-500">Joined</dt><dd>{fmtDate(user.created_at)}</dd></div>
          <div><dt className="text-slate-500">Last login</dt><dd>{fmtDate(user.last_sign_in_at)}</dd></div>
          <div><dt className="text-slate-500">Total paid</dt><dd>{inr(paid.reduce((s, b) => s + b.amount_inr, 0))} ({paid.length} payments)</dd></div>
          <div><dt className="text-slate-500">Staying at</dt><dd>{bookings.filter((b) => b.moved_in).map((b) => b.pgs?.name).join(", ") || "-"}</dd></div>
        </dl>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-bold text-deep">Bookings</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
              <tr><th className="p-3">Booked on</th><th className="p-3">PG / room</th><th className="p-3">Visit date</th><th className="p-3">Amount</th><th className="p-3">Payment</th><th className="p-3">PhonePe txn</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="p-3">{fmtDate(b.created_at)}</td>
                  <td className="p-3">{b.pgs?.name ?? "-"}<div className="text-xs text-slate-500">{b.room_types?.label}</div></td>
                  <td className="p-3">{fmtDate(b.visit_date)}</td>
                  <td className="p-3">{inr(b.amount_inr)}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3 font-mono text-xs text-slate-500">{b.gateway_txn_id ?? "-"}</td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
