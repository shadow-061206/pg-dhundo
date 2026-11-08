import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePG, togglePGActive } from "../actions";
import { genderLabel, inr, minPrice } from "@/lib/utils";
import ConfirmButton from "@/components/ConfirmButton";
import type { PG } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPGs({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const admin = createAdminClient();
  const [{ data }, { data: bookings }] = await Promise.all([
    admin.from("pgs").select("*, room_types(*), colleges(name)").order("created_at", { ascending: false }),
    admin.from("bookings").select("pg_id, moved_in"),
  ]);
  const pgs = (data ?? []) as PG[];
  const residents = new Map<string, number>();
  const bookingCount = new Map<string, number>();
  (bookings ?? []).forEach((b) => {
    bookingCount.set(b.pg_id, (bookingCount.get(b.pg_id) ?? 0) + 1);
    if (b.moved_in) residents.set(b.pg_id, (residents.get(b.pg_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep">PGs &amp; hostels ({pgs.length})</h1>
        <Link href="/admin/pgs/new" className="btn btn-primary"><Plus className="mr-1 h-4 w-4" />Add PG</Link>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">College / city</th>
              <th className="p-3">From</th><th className="p-3">Bookings</th><th className="p-3">Residents</th>
              <th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {pgs.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold text-deep">{p.name}</td>
                <td className="p-3 whitespace-nowrap capitalize">{p.category} · {genderLabel(p.gender)}</td>
                <td className="p-3">{p.colleges?.name ?? "-"}<div className="text-xs text-slate-500">{p.city}</div></td>
                <td className="p-3">{minPrice(p.room_types) ? inr(minPrice(p.room_types)!) : "-"}</td>
                <td className="p-3">{bookingCount.get(p.id) ?? 0}</td>
                <td className="p-3">{residents.get(p.id) ?? 0}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${p.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}`}>
                    {p.is_active ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link href={`/admin/pgs/${p.id}`} className="font-semibold text-brand hover:underline">Edit</Link>
                    <form action={togglePGActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="active" value={String(!p.is_active)} />
                      <button className="font-semibold text-deep hover:underline">{p.is_active ? "Hide" : "Show"}</button>
                    </form>
                    <form action={deletePG}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message={`Delete ${p.name}? This cannot be undone.`} className="font-semibold text-red-700 hover:underline">Delete</ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {pgs.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No PGs yet. Click "Add PG".</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
