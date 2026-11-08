import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchForm from "@/components/SearchForm";
import PGCard from "@/components/PGCard";
import type { College, PG } from "@/lib/types";

export const dynamic = "force-dynamic";

function Skyline() {
  // Simple line-art campus skyline, purely decorative.
  return (
    <svg viewBox="0 0 600 90" className="mx-auto mt-8 w-full max-w-2xl text-brand/40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 88h580" />
      <path d="M30 88V46h50v42M42 58h8M60 58h8M42 70h8M60 70h8M55 46V30l-10-8M55 30l10-8" />
      <path d="M120 88V30h60v58M132 42h10M152 42h10M132 58h10M152 58h10M132 74h10M152 74h10" />
      <path d="M230 88V52l60-22 60 22v36M290 30v-14M262 88V66h56v22M278 66v22M302 66v22" />
      <path d="M390 88V40h54v48M402 52h8M422 52h8M402 68h8M422 68h8" />
      <path d="M480 88V58h40v30M492 70h8M508 70h8M530 88V44h50v44M542 56h8M562 56h8M542 72h8M562 72h8" />
    </svg>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const [{ data: colleges }, { data: featured }] = await Promise.all([
    supabase.from("colleges").select("*").order("name"),
    supabase.from("pgs").select("*, room_types(*), colleges(name)").order("created_at", { ascending: false }).limit(4),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-white to-lav">
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-14 text-center">
          <h1 className="text-balance text-4xl font-extrabold leading-tight text-deep sm:text-5xl">
            Find Your Perfect PG &amp; Hostel Near Your College
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Affordable, secure, and student-friendly accommodations at your fingertips.
          </p>
          <div className="mt-8 text-left">
            <SearchForm colleges={(colleges ?? []) as College[]} />
          </div>
          <Skyline />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-bold text-deep">Recently added</h2>
          <Link href="/pgs" className="text-sm font-semibold text-brand hover:underline">View all listings</Link>
        </div>
        {featured && featured.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(featured as PG[]).map((pg) => <PGCard key={pg.id} pg={pg} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-white p-6 text-slate-500">
            No listings yet. Run <code>supabase/seed.sql</code> in the Supabase SQL Editor to add sample data.
          </p>
        )}
      </section>
    </>
  );
}
