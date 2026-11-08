import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Person = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
};

// All signed-up users (from Supabase Auth). Fetched in pages of 200.
export async function getUsers(): Promise<Person[]> {
  const admin = createAdminClient();
  const all: Person[] = [];
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data.users.length) break;
    all.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        name: (u.user_metadata?.full_name as string) || (u.email ? u.email.split("@")[0] : "User"),
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      }))
    );
    if (data.users.length < 200) break;
  }
  return all;
}

export type BookingRow = {
  id: string;
  user_id: string;
  pg_id: string;
  visit_date: string;
  phone: string;
  status: string;
  amount_inr: number;
  gateway_order_id: string | null;
  gateway_txn_id: string | null;
  moved_in: boolean;
  created_at: string;
  pgs: { name: string } | null;
  room_types: { label: string } | null;
};

export const BOOKING_SELECT =
  "id, user_id, pg_id, visit_date, phone, status, amount_inr, gateway_order_id, gateway_txn_id, moved_in, created_at, pgs(name), room_types(label)";
