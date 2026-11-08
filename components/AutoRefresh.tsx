"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the server page every few seconds while a payment is still being confirmed.
export default function AutoRefresh({ everyMs = 3000, maxTimes = 10 }: { everyMs?: number; maxTimes?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      if (++n > maxTimes) return clearInterval(t);
      router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, maxTimes]);
  return null;
}
