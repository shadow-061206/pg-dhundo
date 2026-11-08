import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pgs?city=Jaipur&gender=boys&college=<uuid>&category=pg
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const supabase = await createClient();

  let q = supabase.from("pgs").select("*, room_types(*)").order("distance_km");
  const city = searchParams.get("city");
  const gender = searchParams.get("gender");
  const college = searchParams.get("college");
  const category = searchParams.get("category");
  if (city) q = q.eq("city", city);
  if (gender) q = q.in("gender", [gender, "unisex"]);
  if (college) q = q.eq("college_id", college);
  if (category) q = q.eq("category", category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
