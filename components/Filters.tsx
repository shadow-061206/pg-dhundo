"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

const EXTRA_AMENITIES = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "food", label: "Food" },
  { key: "laundry", label: "Laundry" },
  { key: "gym", label: "Gym" },
];

// All filter state lives in the URL, so results are shareable and the server does the querying.
export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [price, setPrice] = useState(Number(sp.get("maxPrice")) || 20000);

  function update(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const amenities = (sp.get("amenities") ?? "").split(",").filter(Boolean);
  const occupancy = sp.get("occupancy") ?? "";
  const sort = sp.get("sort") ?? "distance";

  function toggleAmenity(key: string) {
    const next = amenities.includes(key) ? amenities.filter((a) => a !== key) : [...amenities, key];
    update((p) => (next.length ? p.set("amenities", next.join(",")) : p.delete("amenities")));
  }

  return (
    <aside className="space-y-5 text-sm" aria-label="Filters">
      <fieldset>
        <legend className="label">Price range</legend>
        <input
          type="range" min={3000} max={20000} step={500} value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onPointerUp={() => update((p) => p.set("maxPrice", String(price)))}
          onKeyUp={() => update((p) => p.set("maxPrice", String(price)))}
          className="w-full accent-brand" aria-label="Maximum monthly price"
        />
        <p className="text-xs text-slate-500">Up to ₹{price.toLocaleString("en-IN")} per month</p>
      </fieldset>

      <fieldset>
        <legend className="label">AC / Non-AC</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-brand" checked={amenities.includes("ac")} onChange={() => toggleAmenity("ac")} />
          AC
        </label>
      </fieldset>

      <fieldset>
        <legend className="label">Occupancy</legend>
        {[["", "Any"], ["single", "Single"], ["double", "Double"], ["triple", "Triple"]].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 py-0.5">
            <input type="radio" name="occupancy" className="accent-brand" checked={occupancy === v}
              onChange={() => update((p) => (v ? p.set("occupancy", v) : p.delete("occupancy")))} />
            {l}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="label">Amenities</legend>
        {EXTRA_AMENITIES.map((a) => (
          <label key={a.key} className="flex items-center gap-2 py-0.5">
            <input type="checkbox" className="accent-brand" checked={amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} />
            {a.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="label">Sort by</legend>
        {[["distance", "Distance"], ["price", "Price"]].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 py-0.5">
            <input type="radio" name="sort" className="accent-brand" checked={sort === v} onChange={() => update((p) => p.set("sort", v))} />
            {l}
          </label>
        ))}
      </fieldset>
    </aside>
  );
}
