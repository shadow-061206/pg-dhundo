import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AMENITIES } from "@/lib/amenities";
import { genderLabel, inr, minPrice } from "@/lib/utils";
import type { PG, Review } from "@/lib/types";
import PGImage from "@/components/PGImage";
import BookingPanel from "@/components/BookingPanel";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}

export default async function PGDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: reviewRows }, { data: auth }] = await Promise.all([
    supabase.from("pgs").select("*, room_types(*), colleges(name)").eq("id", id).single(),
    supabase.from("reviews").select("*").eq("pg_id", id).order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);
  if (!data) notFound();

  const pg = data as PG;
  const reviews = (reviewRows ?? []) as Review[];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const price = minPrice(pg.room_types);
  const rooms = [...pg.room_types].sort((a, b) => b.price - a.price);

  const distances = [
    ...(pg.colleges?.name && !pg.landmarks.some((l) => l.name === pg.colleges!.name)
      ? [{ name: pg.colleges.name, km: Number(pg.distance_km) }]
      : []),
    ...pg.landmarks,
  ];

  const mapSrc =
    pg.lat && pg.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${pg.lng - 0.01},${pg.lat - 0.007},${pg.lng + 0.01},${pg.lat + 0.007}&layer=mapnik&marker=${pg.lat},${pg.lng}`
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
        <Link href="/" className="hover:underline">Home</Link> / <Link href={`/pgs?city=${pg.city}`} className="hover:underline">{pg.city}</Link>
        {pg.colleges?.name && <> / {pg.colleges.name}</>} / <span className="font-semibold text-slate-700">{pg.name}</span>
      </nav>

      <div className="grid gap-2 sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
        <PGImage src={pg.images[0]} alt={`${pg.name} room`} className="h-56 w-full rounded-xl sm:row-span-2 sm:h-full sm:min-h-[22rem]" />
        <PGImage src={pg.images[1]} alt={`${pg.name} common area`} className="hidden h-full w-full rounded-xl sm:block" />
        <PGImage src={pg.images[2]} alt={`${pg.name} building`} className="hidden h-full w-full rounded-xl sm:block" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-extrabold text-deep">{pg.name} ({genderLabel(pg.gender)})</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" />{pg.address}</p>
            {reviews.length > 0 && (
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Stars value={avg} /> {avg.toFixed(1)} ({reviews.length} review{reviews.length > 1 ? "s" : ""})</p>
            )}
            {price && <p className="mt-3 text-2xl font-extrabold text-deep">{inr(price)}<span className="text-base font-medium text-slate-500">/month</span></p>}
            <div className="mt-4 flex gap-3">
              <a href="#book" className="btn btn-primary">Book a Visit</a>
              {pg.owner_phone && <a href={`tel:${pg.owner_phone}`} className="btn btn-primary">Contact Owner</a>}
            </div>
          </header>

          {pg.description && <p className="max-w-prose text-slate-600">{pg.description}</p>}

          {distances.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-deep">Distance from landmark</h2>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {distances.map((d) => (
                  <li key={d.name} className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{d.name} ({d.km} km)</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold text-deep">Amenities</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {pg.amenities.filter((a) => AMENITIES[a]).map((a) => {
                const Icon = AMENITIES[a].icon;
                return (
                  <li key={a} className="flex flex-col items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-3 text-center text-xs font-medium text-slate-700">
                    <Icon className="h-5 w-5 text-deep" />{AMENITIES[a].label}
                  </li>
                );
              })}
            </ul>
          </section>

          {rooms.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-deep">Room type options</h2>
              <ul className="flex flex-wrap gap-2">
                {rooms.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">{r.label}: <strong>{inr(r.price)}</strong></li>
                ))}
              </ul>
            </section>
          )}

          {mapSrc && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-deep">Location</h2>
              <iframe title={`Map of ${pg.name}`} src={mapSrc} loading="lazy" className="h-64 w-full rounded-xl border border-line" />
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold text-deep">Rules and reviews</h2>
            {pg.rules.length > 0 && (
              <ul className="mb-6 list-disc space-y-1 pl-5 text-sm text-slate-700">{pg.rules.map((r) => <li key={r}>{r}</li>)}</ul>
            )}
            <ReviewForm pgId={pg.id} loggedIn={!!auth.user} />
            <ul className="mt-6 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{r.author_name}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
                </li>
              ))}
              {reviews.length === 0 && <li className="text-sm text-slate-500">No reviews yet. Be the first to share how your stay was.</li>}
            </ul>
          </section>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <BookingPanel
            pgId={pg.id}
            roomTypes={pg.room_types}
            feeInr={pg.visit_fee_inr}
            loggedIn={!!auth.user}
          />
        </div>
      </div>
    </div>
  );
}
