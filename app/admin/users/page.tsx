import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_SELECT, getUsers, type BookingRow } from "@/lib/admin-data";
import { fmtDate, inr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const admin = createAdminClient();
  const [users, { data }] = await Promise.all([getUsers(), admin.from("bookings").select(BOOKING_SELECT)]);
  const bookings = (data ?? []) as unknown as BookingRow[];

  const sorted = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-deep">Users ({users.length})</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Person</th><th className="p-3">Joined</th><th className="p-3">Last login</th>
              <th className="p-3">Bookings</th><th className="p-3">Paid</th><th className="p-3">Staying at</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => {
              const mine = bookings.filter((b) => b.user_id === u.id);
              const paid = mine.filter((b) => b.status === "paid");
              const staying = mine.filter((b) => b.moved_in).map((b) => b.pgs?.name).filter(Boolean);
              return (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/users/${u.id}`} className="font-semibold text-deep hover:underline">{u.name}</Link>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(u.last_sign_in_at)}</td>
                  <td className="p-3">{mine.length}</td>
                  <td className="p-3">{paid.length ? `${paid.length} · ${inr(paid.reduce((s, b) => s + b.amount_inr, 0))}` : "-"}</td>
                  <td className="p-3">{staying.length ? staying.join(", ") : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
