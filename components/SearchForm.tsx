"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { College } from "@/lib/types";

export default function SearchForm({ colleges }: { colleges: College[] }) {
  const router = useRouter();
  const cities = useMemo(() => Array.from(new Set(colleges.map((c) => c.city))).sort(), [colleges]);
  const [city, setCity] = useState("");
  const [college, setCollege] = useState("");
  const [gender, setGender] = useState("");

  const collegeOptions = colleges.filter((c) => !city || c.city === city);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (college) p.set("college", college);
    if (gender) p.set("gender", gender);
    router.push(`/pgs?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl bg-soft p-4 sm:grid-cols-[1fr_1.3fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="city" className="label">Select City</label>
        <select id="city" className="field" value={city} onChange={(e) => { setCity(e.target.value); setCollege(""); }}>
          <option value="">All cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="college" className="label">Select College</label>
        <select id="college" className="field" value={college} onChange={(e) => setCollege(e.target.value)}>
          <option value="">Any college</option>
          {collegeOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="gender" className="label">Gender</label>
        <select id="gender" className="field" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Boys / Girls</option>
          <option value="boys">Boys</option>
          <option value="girls">Girls</option>
        </select>
      </div>
      <button className="btn btn-primary h-[42px] px-6">Find PG</button>
    </form>
  );
}
