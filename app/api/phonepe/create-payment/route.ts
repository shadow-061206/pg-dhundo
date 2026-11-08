import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPhonePePayment } from "@/lib/phonepe";

// Creates a pending booking + a PhonePe checkout session. The fee is read from the database,
// never from the browser.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const { pgId, roomTypeId, visitDate, phone } = await req.json();

    const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
    if (!pgId || !visitDate || digits.length !== 10) {
      return NextResponse.json({ error: "Enter a valid visit date and 10-digit phone number." }, { status: 400 });
    }
    const date = new Date(visitDate);
    const today = new Date(new Date().toDateString());
    if (isNaN(date.getTime()) || date < today) {
      return NextResponse.json({ error: "Choose a visit date from today onwards." }, { status: 400 });
    }

    const { data: pg } = await supabase
      .from("pgs")
      .select("id, name, visit_fee_inr, room_types(id)")
      .eq("id", pgId)
      .single();
    if (!pg) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (roomTypeId && !pg.room_types.some((r: { id: string }) => r.id === roomTypeId)) {
      return NextResponse.json({ error: "Invalid room type." }, { status: 400 });
    }

    // Created with the user's own client so RLS applies (status must be 'pending').
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        pg_id: pg.id,
        room_type_id: roomTypeId || null,
        visit_date: visitDate,
        phone: digits,
        amount_inr: pg.visit_fee_inr,
      })
      .select("id")
      .single();
    if (error || !booking) throw new Error(error?.message || "Could not create booking");

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
    const payment = await createPhonePePayment({
      merchantOrderId: booking.id,
      amountPaise: pg.visit_fee_inr * 100,
      redirectUrl: `${siteUrl}/payment/status?order=${booking.id}`,
      message: `Visit booking fee - ${pg.name}`.slice(0, 60),
    });

    // Only the server may write the gateway order id.
    await createAdminClient().from("bookings").update({ gateway_order_id: payment.orderId }).eq("id", booking.id);

    return NextResponse.json({ redirectUrl: payment.redirectUrl });
  } catch (e) {
    console.error("create-payment", e);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
