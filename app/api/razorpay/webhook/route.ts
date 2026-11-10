import { NextResponse } from "next/server";
import { markBookingPaid, verifyWebhookSignature } from "@/lib/razorpay";

// Backup confirmation: Razorpay calls this even if the buyer closes the tab after paying.
// Set it up in Razorpay Dashboard -> Account & Settings -> Webhooks.
export async function POST(req: Request) {
  const rawBody = await req.text(); // the signature is computed over the exact raw body
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id && payment.currency === "INR") {
      await markBookingPaid(payment.order_id, payment.id, { amountPaise: payment.amount });
    }
  }
  return NextResponse.json({ ok: true });
}
