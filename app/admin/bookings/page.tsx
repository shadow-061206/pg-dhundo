import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_SELECT, getUsers, type BookingRow } from "@/lib/admin-data";
import { setMovedIn } from "../actions";
import { fmtDate, inr } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "paid", "pending", "failed"];

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const admin = createAdminClient();

  let q = admin.from("bookings").select(BOOKING_SELECT).order("created_at", { ascending: false }).limit(500);
  if (FILTERS.includes(status) && status !== "all") q = q.eq("status", status);

  const [{ data }, users] = await Promise.all([q, getUsers()]);
  const rows = (data ?? []) as unknown as BookingRow[];
  const people = new Map(users.map((u) => [u.id, u]));
  const total = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_inr, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-deep">Bookings &amp; payments</h1>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/bookings?status=${f}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${status === f ? "bg-deep text-white" : "border border-line bg-white text-deep hover:bg-soft"}`}>
            {f}
          </Link>
        ))}
        <span className="ml-auto text-sm text-slate-600">{rows.length} shown · paid total {inr(total)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Booked on</th><th className="p-3">Person</th><th className="p-3">Phone</th>
              <th className="p-3">PG / room</th><th className="p-3">Visit date</th><th className="p-3">Amount</th>
              <th className="p-3">Payment</th><th className="p-3">Payment IDs</th><th className="p-3">Moved in</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const p = people.get(b.user_id);
              return (
                <tr key={b.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3 whitespace-nowrap">{fmtDate(b.created_at)}</td>
                  <td className="p-3">
                    <Link href={`/admin/users/${b.user_id}`} className="font-semibold text-deep hover:underline">{p?.name ?? "Unknown"}</Link>
                    <div className="text-xs text-slate-500">{p?.email}</div>
                  </td>
                  <td className="p-3">{b.phone}</td>
                  <td className="p-3">{b.pgs?.name ?? "-"}<div className="text-xs text-slate-500">{b.room_types?.label}</div></td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(b.visit_date)}</td>
                  <td className="p-3">{inr(b.amount_inr)}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3 font-mono text-xs text-slate-500">
                    {b.gateway_order_id && <div>Order: {b.gateway_order_id}</div>}
                    {b.gateway_txn_id && <div>Txn: {b.gateway_txn_id}</div>}
                    {!b.gateway_order_id && "-"}
                  </td>
                  <td className="p-3">
                    {b.status === "paid" ? (
                      <form action={setMovedIn}>
                        <input type="hidden" name="id" value={b.id} />
                        <input type="hidden" name="value" value={String(!b.moved_in)} />
                        <button className={`rounded-lg px-3 py-1 text-xs font-semibold ${b.moved_in ? "bg-green-100 text-green-800" : "border border-line text-deep hover:bg-soft"}`}>
                          {b.moved_in ? "Yes (undo)" : "Mark moved in"}
                        </button>
                      </form>
                    ) : "-"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-500">No bookings found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
