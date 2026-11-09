"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronDown, LogOut, Shield, User } from "lucide-react";
import { signOut } from "@/lib/actions";

type Props = { name: string; email: string; avatar: string | null; isAdmin: boolean };

export default function UserMenu({ name, email, avatar, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const firstName = name.split(" ")[0];
  const item = "flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-lav";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-white/40 py-1 pl-1.5 pr-3 text-white hover:bg-white/10"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold uppercase">
            {firstName.charAt(0)}
          </span>
        )}
        <span className="max-w-[120px] truncate">{firstName}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white py-2 text-slate-700 shadow-lg">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate font-bold text-deep">{name}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <User className="h-4 w-4" /> My profile
          </Link>
          <Link href="/bookings" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <CalendarCheck className="h-4 w-4" /> My bookings
          </Link>
          {isAdmin && (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <Shield className="h-4 w-4" /> Admin panel
            </Link>
          )}
          <form action={signOut} className="mt-1 border-t border-line pt-1">
            <button role="menuitem" className={`${item} text-red-700`}>
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
