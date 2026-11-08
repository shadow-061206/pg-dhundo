import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PG } from "@/lib/types";
import { AMENITIES } from "@/lib/amenities";
import { genderLabel, inr, minPrice } from "@/lib/utils";
import PGImage from "./PGImage";

const tag: Record<string, string> = {
  boys: "bg-blue-100 text-blue-800",
  girls: "bg-pink-100 text-pink-800",
  unisex: "bg-emerald-100 text-emerald-800",
};

export default function PGCard({ pg }: { pg: PG }) {
  const price = minPrice(pg.room_types);
  const shown = pg.amenities.filter((a) => AMENITIES[a]).slice(0, 3);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative">
        <PGImage src={pg.images[0]} alt={pg.name} className="h-40 w-full" />
        <span className={`absolute left-2.5 top-2.5 rounded px-2 py-0.5 text-xs font-bold ${tag[pg.gender]}`}>
          {genderLabel(pg.gender)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-bold text-deep">{pg.name}</h3>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {pg.distance_km} km from {pg.colleges?.name ?? pg.city}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {shown.map((a) => {
            const Icon = AMENITIES[a].icon;
            return (
              <li key={a} className="flex items-center gap-1 rounded-md bg-lav px-2 py-1 text-xs text-slate-600">
                <Icon className="h-3 w-3" />
                {AMENITIES[a].label}
              </li>
            );
          })}
        </ul>
        <p className="mt-auto pt-1 text-lg font-extrabold text-deep">
          {price ? (
            <>
              {inr(price)}
              <span className="text-sm font-medium text-slate-500">/month</span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-500">Price on request</span>
          )}
        </p>
        <Link href={`/pgs/${pg.id}`} className="btn btn-outline w-full">
          View Details
        </Link>
      </div>
    </article>
  );
}
