import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsers } from "@/lib/admin-data";
import { fmtDate } from "@/lib/utils";
import PGForm from "@/components/PGForm";
import type { College, PG } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: pg }, { data: colleges }, { data: residents }, users] = await Promise.all([
    admin.from("pgs").select("*, room_types(*)").eq("id", id).maybeSingle(),
    admin.from("colleges").select("*").order("name"),
    admin.from("bookings").select("user_id, phone, visit_date, room_types(label)").eq("pg_id", id).eq("moved_in", true),
    getUsers(),
  ]);
  if (!pg) notFound();
  const people = new Map(users.map((u) => [u.id, u]));
  type Res = { user_id: string; phone: string; visit_date: string; room_types: { label: string } | null };
  const rows = (residents ?? []) as unknown as Res[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-deep">Edit {pg.name}</h1>

      <section>
        <h2 className="mb-3 text-lg font-bold text-deep">Current residents ({rows.length})</h2>
        {rows.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {rows.map((r) => (
              <li key={r.user_id + r.visit_date} className="flex flex-wrap justify-between gap-2 p-3">
                <span className="font-semibold text-deep">{people.get(r.user_id)?.name ?? "Unknown"} <span className="font-normal text-slate-500">{people.get(r.user_id)?.email}</span></span>
                <span className="text-slate-600">{r.phone} · {r.room_types?.label ?? "-"} · visited {fmtDate(r.visit_date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No one is marked as moved in yet. Use the Bookings page to mark residents.</p>
        )}
      </section>

      <PGForm colleges={(colleges ?? []) as College[]} pg={pg as PG} />
    </div>
  );
}
