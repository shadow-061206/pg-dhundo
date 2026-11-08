"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AMENITIES } from "@/lib/amenities";
import type { FormState } from "@/lib/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (t: string) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const optNum = (v: string) => (v === "" || isNaN(Number(v)) ? null : Number(v));

function refreshPublic() {
  revalidatePath("/");
  revalidatePath("/pgs");
  revalidatePath("/admin", "layout");
}

// ---------- PGs ----------
export async function savePG(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const admin = createAdminClient();

  const id = s(fd, "id");
  const name = s(fd, "name");
  const category = s(fd, "category");
  const gender = s(fd, "gender");
  const address = s(fd, "address");
  const collegeId = s(fd, "college_id");
  let city = s(fd, "city");
  const distance = Number(s(fd, "distance_km") || 0);
  const fee = Math.round(Number(s(fd, "visit_fee_inr")));

  if (!name) return { error: "Enter the PG name." };
  if (!["pg", "hostel"].includes(category)) return { error: "Choose PG or Hostel." };
  if (!["boys", "girls", "unisex"].includes(gender)) return { error: "Choose Boys, Girls or Unisex." };
  if (!address) return { error: "Enter the address." };
  if (!(distance >= 0 && distance < 1000)) return { error: "Distance must be between 0 and 999 km." };
  if (!(fee >= 1)) return { error: "Visit booking fee must be at least ₹1." };

  if (collegeId) {
    const { data: c } = await admin.from("colleges").select("city").eq("id", collegeId).single();
    if (c) city = c.city;
  }
  if (!city) return { error: "Choose a college, or type a city." };

  let rooms: { id?: string; label: string; occupancy: string; price: number }[] = [];
  try {
    rooms = JSON.parse(s(fd, "rooms") || "[]");
  } catch {
    return { error: "Room list is invalid." };
  }
  rooms = rooms.filter((r) => r.label?.trim() || r.price);
  for (const r of rooms) {
    if (!r.label?.trim() || !["single", "double", "triple"].includes(r.occupancy) || !(Number(r.price) >= 1)) {
      return { error: "Each room needs a name, occupancy and a monthly price." };
    }
  }
  if (rooms.length === 0) return { error: "Add at least one room type with a price." };

  const landmarks = lines(s(fd, "landmarks"))
    .map((l) => {
      const [n, km] = l.split("|").map((x) => x.trim());
      return { name: n, km: Number(km) || 0 };
    })
    .filter((l) => l.name);

  const row = {
    name,
    category,
    gender,
    city,
    college_id: collegeId || null,
    distance_km: distance,
    address,
    description: s(fd, "description") || null,
    amenities: fd.getAll("amenities").map(String).filter((a) => a in AMENITIES),
    landmarks,
    images: lines(s(fd, "images")).filter((u) => /^https?:\/\//.test(u)),
    rules: lines(s(fd, "rules")),
    owner_phone: s(fd, "owner_phone") || null,
    visit_fee_inr: fee,
    lat: optNum(s(fd, "lat")),
    lng: optNum(s(fd, "lng")),
  };

  let pgId = id;
  if (id) {
    const { error } = await admin.from("pgs").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin.from("pgs").insert(row).select("id").single();
    if (error || !data) return { error: error?.message ?? "Could not save." };
    pgId = data.id;
  }

  // Sync room types without losing the ids that bookings point to.
  const { data: existing } = await admin.from("room_types").select("id").eq("pg_id", pgId);
  const keep = new Set(rooms.map((r) => r.id).filter(Boolean));
  const toDelete = (existing ?? []).map((e) => e.id).filter((x) => !keep.has(x));
  if (toDelete.length) await admin.from("room_types").delete().in("id", toDelete);
  for (const r of rooms) {
    const payload = { pg_id: pgId, label: r.label.trim(), occupancy: r.occupancy, price: Math.round(Number(r.price)) };
    const res = r.id ? await admin.from("room_types").update(payload).eq("id", r.id) : await admin.from("room_types").insert(payload);
    if (res.error) return { error: res.error.message };
  }

  refreshPublic();
  redirect("/admin/pgs");
}

export async function togglePGActive(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const active = s(fd, "active") === "true";
  await createAdminClient().from("pgs").update({ is_active: active }).eq("id", id);
  refreshPublic();
}

export async function deletePG(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const admin = createAdminClient();
  // Bookings (and their payment records) are deleted with a PG, so refuse and suggest hiding it.
  const { count } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("pg_id", id);
  if (count && count > 0) {
    redirect("/admin/pgs?error=" + encodeURIComponent("This PG has bookings, so it cannot be deleted. Hide it instead."));
  }
  await admin.from("pgs").delete().eq("id", id);
  refreshPublic();
  redirect("/admin/pgs");
}

// ---------- Colleges ----------
export async function addCollege(fd: FormData) {
  await requireAdmin();
  const name = s(fd, "name");
  const city = s(fd, "city");
  if (!name || !city) redirect("/admin/colleges?error=" + encodeURIComponent("Enter both college name and city."));
  const { error } = await createAdminClient()
    .from("colleges")
    .insert({ name, city, lat: optNum(s(fd, "lat")), lng: optNum(s(fd, "lng")) });
  if (error) redirect("/admin/colleges?error=" + encodeURIComponent(error.message));
  refreshPublic();
  redirect("/admin/colleges");
}

export async function deleteCollege(fd: FormData) {
  await requireAdmin();
  await createAdminClient().from("colleges").delete().eq("id", s(fd, "id"));
  refreshPublic();
}

// ---------- Bookings ----------
export async function setMovedIn(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const value = s(fd, "value") === "true";
  await createAdminClient().from("bookings").update({ moved_in: value }).eq("id", id).eq("status", "paid");
  revalidatePath("/admin", "layout");
}
