"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, GraduationCap, CreditCard, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pgs", label: "PGs & hostels", icon: Building2 },
  { href: "/admin/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/admin/bookings", label: "Bookings & payments", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="mb-6 flex gap-1 overflow-x-auto lg:mb-0 lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active ? "bg-deep text-white" : "text-deep hover:bg-soft"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
