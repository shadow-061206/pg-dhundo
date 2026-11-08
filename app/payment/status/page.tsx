import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { syncBookingPayment } from "@/lib/phonepe";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

// PhonePe sends the buyer back here. We ask PhonePe for the real status before showing anything.
export default async function PaymentStatus({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!order) redirect("/bookings");

  const status = await syncBookingPayment(order, user.id);
  const { data: booking } = await supabase
    .from("bookings")
    .select("visit_date, phone, pg_id, pgs(name)")
    .eq("id", order)
    .maybeSingle();
  const pg = booking?.pgs as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-deep">Visit booked</h1>
          <p className="mt-2 text-slate-600">
            Your payment went through. The owner of {pg?.name ?? "the PG"} will call you on {booking?.phone} to confirm the time on{" "}
            {booking && new Date(booking.visit_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}.
          </p>
          <Link href="/bookings" className="btn btn-primary mt-6">View my bookings</Link>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-2xl font-extrabold text-deep">Payment not completed</h1>
          <p className="mt-2 text-slate-600">You have not been charged. If money was debited, it is refunded automatically by your bank or PhonePe.</p>
          <Link href={booking ? `/pgs/${booking.pg_id}#book` : "/pgs"} className="btn btn-primary mt-6">Try again</Link>
        </>
      )}
      {(status === "pending" || status === null) && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand" />
          <h1 className="mt-4 text-2xl font-extrabold text-deep">Confirming your payment…</h1>
          <p className="mt-2 text-slate-600">This usually takes a few seconds. You can also check My bookings later.</p>
          <AutoRefresh />
          <Link href="/bookings" className="btn btn-outline mt-6">Go to my bookings</Link>
        </>
      )}
    </div>
  );
}
