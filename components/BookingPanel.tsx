"use client";

import { useState } from "react";
import Link from "next/link";
import { inr } from "@/lib/utils";
import type { RoomType } from "@/lib/types";

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

  const today = new Date().toISOString().slice(0, 10);

  async function pay() {
    setError("");
    if (!date || date < today) return setError("Choose a visit date from today onwards.");
    if (phone.replace(/\D/g, "").length < 10) return setError("Enter a 10-digit phone number.");

    setBusy(true);
    try {
      const res = await fetch("/api/phonepe/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pgId, roomTypeId, visitDate: date, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.redirectUrl; // PhonePe hosted checkout
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
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
            {busy ? "Opening PhonePe…" : `Pay ${inr(feeInr)} with PhonePe`}
          </button>
          <p className="text-center text-xs text-slate-500">You will be taken to PhonePe's secure page to pay.</p>
        </div>
      )}
    </div>
  );
}
