"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email: string;
  fullName: string;
  phone: string;
  avatar: string | null;
  canChangePassword: boolean;
};

export default function ProfileForm({ email, fullName, phone, avatar, canChangePassword }: Props) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [mobile, setMobile] = useState(phone);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [password, setPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const digits = mobile.replace(/\D/g, "").slice(-10);
    if (!name.trim()) return setMsg({ ok: false, text: "Please enter your name." });
    if (mobile && digits.length !== 10) return setMsg({ ok: false, text: "Enter a 10-digit phone number or leave it empty." });

    setBusy(true);
    const { error } = await createClient().auth.updateUser({ data: { full_name: name.trim(), phone: digits } });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setMsg({ ok: true, text: "Profile updated." });
    router.refresh(); // updates the name in the navbar
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (password.length < 6) return setPwMsg({ ok: false, text: "Password must be at least 6 characters." });
    setPwBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPwBusy(false);
    if (error) return setPwMsg({ ok: false, text: error.message });
    setPassword("");
    setPwMsg({ ok: true, text: "Password changed." });
  }

  const note = (m: { ok: boolean; text: string } | null) =>
    m && (
      <p role={m.ok ? "status" : "alert"} className={`rounded-lg p-3 text-sm ${m.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
        {m.text}
      </p>
    );

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold uppercase text-white">
              {(name || email).charAt(0)}
            </span>
          )}
          <p className="text-sm text-slate-500">{avatar ? "Your photo comes from your Google account." : "Your initial is shown as your photo."}</p>
        </div>

        <div>
          <label htmlFor="p-name" className="label">Full name</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="field" autoComplete="name" required />
        </div>
        <div>
          <label htmlFor="p-email" className="label">Email</label>
          <input id="p-email" value={email} readOnly className="field bg-lav text-slate-500" />
          <p className="mt-1 text-xs text-slate-500">Email cannot be changed here.</p>
        </div>
        <div>
          <label htmlFor="p-phone" className="label">Phone number</label>
          <input id="p-phone" type="tel" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} className="field" placeholder="10-digit mobile number" autoComplete="tel" />
        </div>

        {note(msg)}
        <button disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save changes"}</button>
      </form>

      {canChangePassword && (
        <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-line bg-white p-6">
          <h2 className="text-lg font-bold text-deep">Change password</h2>
          <div>
            <label htmlFor="p-pw" className="label">New password</label>
            <input id="p-pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="field" autoComplete="new-password" />
          </div>
          {note(pwMsg)}
          <button disabled={pwBusy} className="btn btn-outline">{pwBusy ? "Updating…" : "Update password"}</button>
        </form>
      )}
    </div>
  );
}
