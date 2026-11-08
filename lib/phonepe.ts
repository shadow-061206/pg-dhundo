import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// PhonePe Standard Checkout (API v2): OAuth token -> create payment -> redirect -> verify status.
const LIVE = process.env.PHONEPE_ENV === "live";

const AUTH_URL = LIVE
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PG_BASE = LIVE ? "https://api.phonepe.com/apis/pg" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

let cached: { header: string; expiresAt: number } | null = null;

async function getAuthHeader(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 60 > now) return cached.header;

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET");

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_version: process.env.PHONEPE_CLIENT_VERSION || "1",
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`PhonePe auth failed (${res.status})`);

  cached = {
    header: `${data.token_type || "O-Bearer"} ${data.access_token}`,
    expiresAt: Number(data.expires_at) || now + 300,
  };
  return cached.header;
}

/** Creates a hosted checkout session. amountPaise: 100 paise = Rs 1. Returns the page to send the buyer to. */
export async function createPhonePePayment(opts: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
  message: string;
}) {
  const res = await fetch(`${PG_BASE}/checkout/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await getAuthHeader() },
    body: JSON.stringify({
      merchantOrderId: opts.merchantOrderId,
      amount: opts.amountPaise,
      expireAfter: 1200, // checkout page valid for 20 minutes
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: opts.message,
        merchantUrls: { redirectUrl: opts.redirectUrl },
      },
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.redirectUrl) {
    throw new Error(data?.message || data?.code || `PhonePe pay failed (${res.status})`);
  }
  return data as { orderId: string; state: string; redirectUrl: string };
}

async function getOrderStatus(merchantOrderId: string) {
  const res = await fetch(`${PG_BASE}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`, {
    headers: { "Content-Type": "application/json", Authorization: await getAuthHeader() },
    cache: "no-store",
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

/**
 * The single place where a booking becomes "paid". It asks PhonePe directly (never trusts the
 * browser or a webhook body), checks the amount, and updates the row once.
 * Returns the booking's resulting status, or null if the booking does not exist.
 */
export async function syncBookingPayment(bookingId: string, userId?: string): Promise<string | null> {
  const admin = createAdminClient();
  let q = admin.from("bookings").select("id, status, amount_inr").eq("id", bookingId);
  if (userId) q = q.eq("user_id", userId);
  const { data: booking } = await q.maybeSingle();
  if (!booking) return null;
  if (booking.status !== "pending") return booking.status;

  const { ok, data } = await getOrderStatus(booking.id);
  if (!ok) return "pending"; // e.g. buyer has not reached the payment page yet

  if (data.state === "COMPLETED") {
    if (Number(data.amount) !== booking.amount_inr * 100) {
      console.error("PhonePe amount mismatch", booking.id, data.amount);
      await admin.from("bookings").update({ status: "failed" }).eq("id", booking.id).eq("status", "pending");
      return "failed";
    }
    await admin
      .from("bookings")
      .update({ status: "paid", gateway_txn_id: data.paymentDetails?.[0]?.transactionId ?? null })
      .eq("id", booking.id)
      .eq("status", "pending");
    return "paid";
  }
  if (data.state === "FAILED") {
    await admin.from("bookings").update({ status: "failed" }).eq("id", booking.id).eq("status", "pending");
    return "failed";
  }
  return "pending";
}

/** PhonePe sends Authorization: SHA256(username:password) with each webhook. */
export function isValidWebhookAuth(header: string | null): boolean {
  const user = process.env.PHONEPE_WEBHOOK_USERNAME;
  const pass = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!user || !pass || !header) return false;
  const expected = crypto.createHash("sha256").update(`${user}:${pass}`).digest("hex");
  const got = header.trim().split(/\s+/).pop()!.toLowerCase();
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
