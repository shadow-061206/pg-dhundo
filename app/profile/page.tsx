import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const meta = user.user_metadata ?? {};

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-deep">My profile</h1>
      <ProfileForm
        email={user.email ?? ""}
        fullName={meta.full_name || meta.name || ""}
        phone={meta.phone || ""}
        avatar={meta.avatar_url || meta.picture || null}
        canChangePassword={user.app_metadata?.provider === "email"}
      />
      <p className="mt-6 text-sm">
        <Link href="/bookings" className="font-semibold text-brand hover:underline">View my bookings</Link>
      </p>
    </div>
  );
}
