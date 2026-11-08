import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const admin = await getAdminUser();
  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-deep">No admin access</h1>
        <p className="mt-3 text-slate-600">
          {user.email} is not an admin. The site owner can add it by running the admin SQL (see README) in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[210px_1fr] lg:gap-8">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
