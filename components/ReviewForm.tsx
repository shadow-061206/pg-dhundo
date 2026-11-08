"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";

export default function ReviewForm({ pgId, loggedIn }: { pgId: string; loggedIn: boolean }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loggedIn) {
    return (
      <p className="text-sm text-slate-500">
        <Link href={`/login?next=/pgs/${pgId}`} className="font-semibold text-brand hover:underline">Log in</Link> to leave a review.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pgId, rating, comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(data.error || "Could not save your review.");
    setComment("");
    setMsg("Review saved.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-checked={rating === n} role="radio">
            <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder="What was it like to stay here?" className="field" />
      <div className="flex items-center gap-3">
        <button disabled={busy || rating === 0} className="btn btn-primary">Save review</button>
        {msg && <span className="text-sm text-slate-600" role="status">{msg}</span>}
      </div>
    </form>
  );
}
