"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { savePG } from "@/app/admin/actions";
import { AMENITIES } from "@/lib/amenities";
import type { College, FormState, PG } from "@/lib/types";
import ImageUploader from "./ImageUploader";

type Room = { id?: string; label: string; occupancy: string; price: string };

export default function PGForm({ colleges, pg }: { colleges: College[]; pg?: PG }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePG, {});
  const [images, setImages] = useState<string[]>(pg?.images ?? []);
  const [rooms, setRooms] = useState<Room[]>(
    pg?.room_types.length
      ? pg.room_types.map((r) => ({ id: r.id, label: r.label, occupancy: r.occupancy, price: String(r.price) }))
      : [
          { label: "Single Occupancy", occupancy: "single", price: "" },
          { label: "Double Sharing", occupancy: "double", price: "" },
        ]
  );

  const setRoom = (i: number, patch: Partial<Room>) => setRooms(rooms.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="space-y-8">
      {pg && <input type="hidden" name="id" value={pg.id} />}
      <input type="hidden" name="images" value={images.join("\n")} />
      <input type="hidden" name="rooms" value={JSON.stringify(rooms)} />

      <fieldset className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <legend className="px-1 text-lg font-bold text-deep">Basic details</legend>
        <div className="sm:col-span-2"><label htmlFor="name" className="label">Name</label><input id="name" name="name" required defaultValue={pg?.name} className="field" /></div>
        <div>
          <label htmlFor="category" className="label">Type</label>
          <select id="category" name="category" defaultValue={pg?.category ?? "pg"} className="field"><option value="pg">PG</option><option value="hostel">Hostel</option></select>
        </div>
        <div>
          <label htmlFor="gender" className="label">For</label>
          <select id="gender" name="gender" defaultValue={pg?.gender ?? "boys"} className="field"><option value="boys">Boys</option><option value="girls">Girls</option><option value="unisex">Unisex</option></select>
        </div>
        <div>
          <label htmlFor="college_id" className="label">Nearest college</label>
          <select id="college_id" name="college_id" defaultValue={pg?.college_id ?? ""} className="field">
            <option value="">None (type a city below)</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="label">City <span className="font-normal text-slate-500">(only if no college)</span></label>
          <input id="city" name="city" defaultValue={pg?.city} className="field" />
        </div>
        <div><label htmlFor="distance_km" className="label">Distance from college (km)</label><input id="distance_km" name="distance_km" type="number" step="0.1" min="0" defaultValue={pg?.distance_km ?? 1} className="field" /></div>
        <div><label htmlFor="visit_fee_inr" className="label">Visit booking fee (₹)</label><input id="visit_fee_inr" name="visit_fee_inr" type="number" min="1" required defaultValue={pg?.visit_fee_inr ?? 500} className="field" /></div>
        <div className="sm:col-span-2"><label htmlFor="address" className="label">Address</label><input id="address" name="address" required defaultValue={pg?.address} className="field" /></div>
        <div className="sm:col-span-2"><label htmlFor="description" className="label">Description</label><textarea id="description" name="description" rows={3} defaultValue={pg?.description ?? ""} className="field" /></div>
        <div><label htmlFor="owner_phone" className="label">Owner phone</label><input id="owner_phone" name="owner_phone" defaultValue={pg?.owner_phone ?? ""} className="field" placeholder="+919876543210" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="lat" className="label">Latitude</label><input id="lat" name="lat" inputMode="decimal" defaultValue={pg?.lat ?? ""} className="field" /></div>
          <div><label htmlFor="lng" className="label">Longitude</label><input id="lng" name="lng" inputMode="decimal" defaultValue={pg?.lng ?? ""} className="field" /></div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-white p-5">
        <legend className="px-1 text-lg font-bold text-deep">Room types &amp; monthly prices</legend>
        <div className="space-y-3">
          {rooms.map((r, i) => (
            <div key={r.id ?? i} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end">
              <div><label className="label" htmlFor={`rl-${i}`}>Name</label><input id={`rl-${i}`} value={r.label} onChange={(e) => setRoom(i, { label: e.target.value })} className="field" /></div>
              <div>
                <label className="label" htmlFor={`ro-${i}`}>Occupancy</label>
                <select id={`ro-${i}`} value={r.occupancy} onChange={(e) => setRoom(i, { occupancy: e.target.value })} className="field"><option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option></select>
              </div>
              <div><label className="label" htmlFor={`rp-${i}`}>Price / month (₹)</label><input id={`rp-${i}`} type="number" min="1" value={r.price} onChange={(e) => setRoom(i, { price: e.target.value })} className="field" /></div>
              <button type="button" aria-label="Remove room" onClick={() => setRooms(rooms.filter((_, idx) => idx !== i))} className="btn btn-outline h-[42px]"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRooms([...rooms, { label: "", occupancy: "double", price: "" }])} className="btn btn-outline mt-4"><Plus className="mr-1 h-4 w-4" />Add room type</button>
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-white p-5">
        <legend className="px-1 text-lg font-bold text-deep">Amenities</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(AMENITIES).map(([key, a]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="amenities" value={key} defaultChecked={pg?.amenities.includes(key)} className="accent-brand" />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <legend className="px-1 text-lg font-bold text-deep">Nearby places &amp; rules</legend>
        <div>
          <label htmlFor="landmarks" className="label">Distance from landmarks</label>
          <textarea id="landmarks" name="landmarks" rows={4} className="field" placeholder={"Bus Stand | 1.5\nMetro Station | 2"}
            defaultValue={pg?.landmarks.map((l) => `${l.name} | ${l.km}`).join("\n")} />
          <p className="mt-1 text-xs text-slate-500">One per line: name | km</p>
        </div>
        <div>
          <label htmlFor="rules" className="label">Rules</label>
          <textarea id="rules" name="rules" rows={4} className="field" placeholder={"No loud music after 10 PM\nEntry closes at 10 PM"} defaultValue={pg?.rules.join("\n")} />
          <p className="mt-1 text-xs text-slate-500">One rule per line</p>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-white p-5">
        <legend className="px-1 text-lg font-bold text-deep">Photos</legend>
        <ImageUploader images={images} onChange={setImages} />
      </fieldset>

      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-primary px-6">{pending ? "Saving…" : pg ? "Save changes" : "Add PG"}</button>
        <Link href="/admin/pgs" className="btn btn-outline">Cancel</Link>
      </div>
    </form>
  );
}
