import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in to review." }, { status: 401 });

  const { pgId, rating, comment } = await req.json();
  const r = Number(rating);
  if (!pgId || !Number.isInteger(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  }

  const author =
    (user.user_metadata?.full_name as string | undefined) || (user.email ? user.email.split("@")[0] : "Student");

  const { error } = await supabase.from("reviews").upsert(
    { pg_id: pgId, user_id: user.id, author_name: author, rating: r, comment: String(comment ?? "").slice(0, 1000) },
    { onConflict: "pg_id,user_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
