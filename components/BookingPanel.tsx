"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { inr } from "@/lib/utils";
import type { RoomType } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Razorpay. Check your internet connection."));
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

type Props = {
  pgId: string;
  roomTypes: RoomType[];
  feeInr: number;
  loggedIn: boolean;
};

export default function BookingPanel({ pgId, roomTypes, feeInr, loggedIn }: Props) {
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const finished = useRef(false); // stops the "cancelled" message after a successful payment

  const today = new Date().toISOString().slice(0, 10);

  async function pay() {
    setError("");
    if (!date || date < today) return setError("Choose a visit date from today onwards.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Enter a 10-digit phone number.");
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) return setError("Payments are not configured yet.");

    setBusy(true);
    finished.current = false;
    try {
      // 1) Server creates the booking + Razorpay order
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgId, roomTypeId, visitDate: date, phone }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not start payment.");

      // 2) Open the Razorpay payment modal
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "PGdekho",
        description: "Visit booking fee",
        prefill: { contact: phone.replace(/\D/g, "").slice(-10) },
        theme: { color: "#2a1458" },
        // 3) Payment succeeded in the modal: send the three values to our server to verify
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          finished.current = true;
          try {
            const v = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const data = await v.json();
            if (!v.ok) throw new Error(data.error || "Payment could not be verified.");
            setPaid(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Payment could not be verified.");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (finished.current) return;
            setBusy(false);
            setError("Payment cancelled. You have not been charged.");
          },
        },
      });
      rzp.on("payment.failed", (r: { error?: { description?: string } }) => {
        setError(r.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (paid) {
    return (
      <div id="book" className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="flex items-center gap-2 font-bold text-green-800">
          <CheckCircle2 className="h-5 w-5" /> Visit booked
        </p>
        <p className="mt-2 text-sm text-green-900">
          Your payment went through. The owner will call you on {phone} to confirm the time on {date}.
        </p>
        <Link href="/bookings" className="btn btn-primary mt-4 w-full">View my bookings</Link>
      </div>
    );
  }

  return (
    <div id="book" className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-deep">Book a visit</h2>
      <p className="mt-1 text-sm text-slate-500">Pay a small fee ({inr(feeInr)}) to reserve your visit slot.</p>

      {!loggedIn ? (
        <Link href={`/login?next=/pgs/${pgId}`} className="btn btn-primary mt-4 w-full">
          Log in to book a visit
        </Link>
      ) : (
        <div className="mt-4 space-y-4">
          {roomTypes.length > 0 && (
            <fieldset>
              <legend className="label">Room type</legend>
              <div className="flex flex-wrap gap-2">
                {roomTypes.map((r) => (
                  <label key={r.id}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${roomTypeId === r.id ? "border-deep bg-soft font-semibold text-deep" : "border-line"}`}>
                    <input type="radio" name="room" className="sr-only" checked={roomTypeId === r.id} onChange={() => setRoomTypeId(r.id)} />
                    {r.label}: {inr(r.price)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div>
            <label htmlFor="visit-date" className="label">Visit date</label>
            <input id="visit-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="visit-phone" className="label">Your phone number</label>
            <input id="visit-phone" type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" />
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button onClick={pay} disabled={busy} className="btn btn-primary w-full">
            {busy ? "Processing…" : `Pay ${inr(feeInr)}`}
          </button>
          <p className="text-center text-xs text-slate-500">Secure payment by Razorpay: UPI, cards and net banking.</p>
        </div>
      )}
    </div>
  );
}
