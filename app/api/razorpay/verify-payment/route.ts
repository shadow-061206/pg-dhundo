import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markBookingPaid, verifyPaymentSignature } from "@/lib/razorpay";

// Called by the browser after Razorpay Checkout succeeds. Nothing the browser says is trusted
// until the signature (made with our Key Secret) matches.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      // Do NOT mark as paid.
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }

    const result = await markBookingPaid(razorpay_order_id, razorpay_payment_id, { userId: user.id });
    if (result !== "paid") return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("verify-payment", e);
    return NextResponse.json({ error: "Could not confirm payment. Contact support with your payment receipt." }, { status: 500 });
  }
}
