"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(params.get("error") ? "Sign-in failed. Please try again." : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setMsg("Check your email to confirm your account, then log in.");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    router.push(next);
    router.refresh();
  }

  async function google() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <h1 className="text-2xl font-extrabold text-deep">{mode === "login" ? "Log in" : "Create your account"}</h1>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="field" autoComplete="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="field"
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
        {msg && <p role="alert" className="rounded-lg bg-soft p-3 text-sm text-deep">{msg}</p>}
        <button disabled={busy} className="btn btn-primary w-full">{mode === "login" ? "Log in" : "Sign up"}</button>
      </form>

      <button onClick={google} className="btn btn-outline mt-3 w-full">Continue with Google</button>

      <p className="mt-5 text-center text-sm text-slate-600">
        {mode === "login" ? "New to PGdekho?" : "Already have an account?"}{" "}
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }} className="font-semibold text-brand hover:underline">
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </div>
  );
}
