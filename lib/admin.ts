import "server-only";
import { createClient } from "@/lib/supabase/server";

// An admin is a user whose id is in the `admins` table. The check uses the user's own session
// (RLS lets a user read only their own row), so it works without any secret key.
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}

// Call at the top of EVERY admin server action: actions can be invoked directly, so page guards are not enough.
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized");
  return user;
}
