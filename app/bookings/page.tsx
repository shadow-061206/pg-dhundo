import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const badge: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-700",
};

export default async function Bookings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, visit_date, status, amount_inr, created_at, pgs(id, name, address), room_types(label, price)")
    .order("created_at", { ascending: false });

  type Row = {
    id: string; visit_date: string; status: string; amount_inr: number;
    pgs: { id: string; name: string; address: string } | null;
    room_types: { label: string; price: number } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-extrabold text-deep">My bookings</h1>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-6 text-slate-500">
          You have not booked a visit yet. <Link href="/pgs" className="font-semibold text-brand hover:underline">Browse PGs</Link> to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/pgs/${b.pgs?.id}`} className="font-bold text-deep hover:underline">{b.pgs?.name}</Link>
                  <p className="text-sm text-slate-500">{b.pgs?.address}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-bold capitalize ${badge[b.status]}`}>{b.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Visit on <strong>{new Date(b.visit_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                {b.room_types && <> · {b.room_types.label}</>}
                {" · "}Fee {inr(b.amount_inr)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
