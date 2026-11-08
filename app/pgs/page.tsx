import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PGCard from "@/components/PGCard";
import Filters from "@/components/Filters";
import type { College, PG } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

export default async function Browse({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase.from("pgs").select("*, room_types(*), colleges(name)");
  if (sp.city) q = q.eq("city", sp.city);
  if (sp.college) q = q.eq("college_id", sp.college);
  if (sp.category) q = q.eq("category", sp.category);
  if (sp.gender) q = q.in("gender", [sp.gender, "unisex"]);
  const amenities = (sp.amenities ?? "").split(",").filter(Boolean);
  if (amenities.length) q = q.contains("amenities", amenities);
  q = q.order("distance_km");

  const [{ data }, { data: college }] = await Promise.all([
    q,
    sp.college
      ? supabase.from("colleges").select("*").eq("id", sp.college).single()
      : Promise.resolve({ data: null as College | null }),
  ]);

  // Price and occupancy depend on room types, so they are applied here.
  const maxPrice = Number(sp.maxPrice) || Infinity;
  let pgs = ((data ?? []) as PG[]).filter((pg) => {
    const rooms = sp.occupancy ? pg.room_types.filter((r) => r.occupancy === sp.occupancy) : pg.room_types;
    return rooms.some((r) => r.price <= maxPrice);
  });
  if (sp.sort === "price") {
    const lowest = (pg: PG) => Math.min(...pg.room_types.map((r) => r.price), Infinity);
    pgs = [...pgs].sort((a, b) => lowest(a) - lowest(b));
  }

  const where = college?.name ?? sp.city ?? "all cities";
  const mapSrc =
    college?.lat && college?.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${college.lng - 0.02},${college.lat - 0.015},${college.lng + 0.02},${college.lat + 0.015}&layer=mapnik&marker=${college.lat},${college.lng}`
      : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[210px_1fr_320px]">
      <Suspense fallback={null}>
        <Filters />
      </Suspense>

      <section>
        <h1 className="mb-4 text-xl font-bold text-deep">
          Found {pgs.length} {pgs.length === 1 ? "place" : "places"} near {where}
        </h1>
        {pgs.length ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {pgs.map((pg) => <PGCard key={pg.id} pg={pg} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-white p-6 text-slate-500">
            Nothing matches these filters. Try a higher price limit or remove an amenity.
          </p>
        )}
      </section>

      {mapSrc && (
        <div className="hidden lg:block">
          <iframe title={`Map of ${where}`} src={mapSrc} className="sticky top-4 h-[420px] w-full rounded-xl border border-line" loading="lazy" />
        </div>
      )}
    </div>
  );
}
