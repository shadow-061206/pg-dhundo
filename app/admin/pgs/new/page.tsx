import { createAdminClient } from "@/lib/supabase/admin";
import PGForm from "@/components/PGForm";
import type { College } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewPG() {
  const { data } = await createAdminClient().from("colleges").select("*").order("name");
  const colleges = (data ?? []) as College[];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-deep">Add a PG / hostel</h1>
      {colleges.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Tip: add the college first (Colleges page) so the city shows up in search.</p>
      )}
      <PGForm colleges={colleges} />
    </div>
  );
}
