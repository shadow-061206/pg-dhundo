import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Razorpay Standard Checkout, server side. Uses the REST API directly (no SDK needed).
// Key ID is public (also used in the browser); Key Secret must stay on the server.
const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export class RazorpayError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Creates an Order. amountPaise: 100 paise = Rs 1 (minimum 100). */
export async function createRazorpayOrder(opts: { amountPaise: number; receipt: string; bookingId: string }) {
  if (!KEY_ID || !KEY_SECRET) throw new RazorpayError("Razorpay keys are not configured", 500);
  if (!Number.isInteger(opts.amountPaise) || opts.amountPaise < 100) {
    throw new RazorpayError("Amount must be at least 100 paise", 400);
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      receipt: opts.receipt, // max 40 characters
      notes: { booking_id: opts.bookingId },
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new RazorpayError("Razorpay authentication failed. Check your keys.", 401);
  if (!res.ok || !data.id) throw new RazorpayError(data?.error?.description || `Razorpay error (${res.status})`, 500);
  return data as { id: string; amount: number; currency: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal the signature from Checkout. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!KEY_SECRET) return false;
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature = HMAC-SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

/**
 * The one place a booking becomes "paid". Only moves a pending booking to paid, once.
 * Returns "paid", "mismatch" (amount differs), or null (booking not found).
 */
export async function markBookingPaid(
  orderId: string,
  paymentId: string,
  opts: { userId?: string; amountPaise?: number } = {}
) {
  const admin = createAdminClient();
  let q = admin.from("bookings").select("id, status, amount_inr").eq("gateway_order_id", orderId);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  const { data: booking } = await q.maybeSingle();
  if (!booking) return null;
  if (booking.status === "paid") return "paid";

  if (opts.amountPaise !== undefined && opts.amountPaise !== booking.amount_inr * 100) {
    console.error("Razorpay amount mismatch", booking.id, opts.amountPaise);
    return "mismatch";
  }

  await admin
    .from("bookings")
    .update({ status: "paid", gateway_txn_id: paymentId })
    .eq("id", booking.id)
    .eq("status", "pending");
  return "paid";
}
