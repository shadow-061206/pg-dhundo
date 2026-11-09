import Link from "next/link";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "Home" },
  { href: "/pgs?category=pg", label: "Browse PGs" },
  { href: "/pgs?category=hostel", label: "Hostels" },
  { href: "/contact", label: "Contact Us" },
];

export default async function Navbar() {
  let account: { name: string; email: string; avatar: string | null; isAdmin: boolean } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const meta = user.user_metadata ?? {};
      const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
      account = {
        // Google gives full_name / name; email sign-ups use the name typed on the sign-up form
        name: meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "Account"),
        email: user.email ?? "",
        avatar: meta.avatar_url || meta.picture || null,
        isAdmin: !!admin,
      };
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
          <li>
            {account ? (
              <UserMenu {...account} />
            ) : (
              <Link href="/login" className="rounded-lg border border-white/40 px-3.5 py-1.5 text-white hover:bg-white/10">
                Login / Sign Up
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
