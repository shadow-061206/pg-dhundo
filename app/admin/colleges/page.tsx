import { createAdminClient } from "@/lib/supabase/admin";
import { addCollege, deleteCollege } from "../actions";
import ConfirmButton from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminColleges({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const admin = createAdminClient();
  const [{ data: colleges }, { data: pgs }] = await Promise.all([
    admin.from("colleges").select("*").order("city").order("name"),
    admin.from("pgs").select("college_id"),
  ]);
  const counts = new Map<string, number>();
  (pgs ?? []).forEach((p) => p.college_id && counts.set(p.college_id, (counts.get(p.college_id) ?? 0) + 1));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-deep">Colleges &amp; cities</h1>
      <p className="max-w-prose text-sm text-slate-600">
        A city appears in the website's city list as soon as it has a college. Add the college first, then add PGs near it.
      </p>

      <form action={addCollege} className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-end">
        <div><label htmlFor="c-name" className="label">College name</label><input id="c-name" name="name" required className="field" placeholder="e.g. MNIT Jaipur" /></div>
        <div><label htmlFor="c-city" className="label">City</label><input id="c-city" name="city" required className="field" placeholder="e.g. Jaipur" /></div>
        <div><label htmlFor="c-lat" className="label">Latitude</label><input id="c-lat" name="lat" inputMode="decimal" className="field" placeholder="26.8630" /></div>
        <div><label htmlFor="c-lng" className="label">Longitude</label><input id="c-lng" name="lng" inputMode="decimal" className="field" placeholder="75.8100" /></div>
        <button className="btn btn-primary h-[42px]">Add college</button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-lav text-xs uppercase text-slate-500">
            <tr><th className="p-3">College</th><th className="p-3">City</th><th className="p-3">PGs</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(colleges ?? []).map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold text-deep">{c.name}</td>
                <td className="p-3">{c.city}</td>
                <td className="p-3">{counts.get(c.id) ?? 0}</td>
                <td className="p-3 text-right">
                  <form action={deleteCollege}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton message={`Delete ${c.name}? Its PGs stay but lose the college link.`} className="text-sm font-semibold text-red-700 hover:underline">Delete</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {(colleges ?? []).length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No colleges yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
