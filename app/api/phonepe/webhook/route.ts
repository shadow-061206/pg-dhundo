import { NextResponse } from "next/server";
import { isValidWebhookAuth, syncBookingPayment } from "@/lib/phonepe";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PhonePe calls this when an order completes or fails (backup for buyers who close the tab).
// The body is only used to find the booking; the real status is re-fetched from PhonePe.
export async function POST(req: Request) {
  if (!isValidWebhookAuth(req.headers.get("authorization"))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = body?.payload?.merchantOrderId;
  if (typeof id === "string" && UUID.test(id)) {
    await syncBookingPayment(id);
  }
  return NextResponse.json({ ok: true });
}
