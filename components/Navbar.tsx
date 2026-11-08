import Link from "next/link";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";

const links = [
  { href: "/", label: "Home" },
  { href: "/pgs?category=pg", label: "Browse PGs" },
  { href: "/pgs?category=hostel", label: "Hostels" },
  { href: "/contact", label: "Contact Us" },
];

export default async function Navbar() {
  let email: string | null = null;
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
    if (user) {
      const { data: a } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
      isAdmin = !!a;
    }
  } catch {
    // Supabase not configured yet: render the navbar as logged out.
  }

  return (
    <header className="bg-deep">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5">
        <Logo />
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-white/90">
          {links.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
          {email ? (
            <>
              {isAdmin && (
                <li>
                  <Link href="/admin" className="font-bold text-[#a78bfa] hover:text-white">
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link href="/bookings" className="hover:text-white">
                  My bookings
                </Link>
              </li>
              <li>
                <form action={signOut}>
                  <button className="rounded-lg border border-white/40 px-3.5 py-1.5 text-white hover:bg-white/10">
                    Log out
                  </button>
                </form>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" className="rounded-lg border border-white/40 px-3.5 py-1.5 text-white hover:bg-white/10">
                Login / Sign Up
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
