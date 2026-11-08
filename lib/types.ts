export type RoomType = {
  id: string;
  pg_id: string;
  label: string;
  occupancy: "single" | "double" | "triple";
  price: number;
};

export type Landmark = { name: string; km: number };

export type College = { id: string; name: string; city: string; lat: number | null; lng: number | null };

export type PG = {
  id: string;
  name: string;
  category: "pg" | "hostel";
  gender: "boys" | "girls" | "unisex";
  city: string;
  college_id: string | null;
  distance_km: number;
  address: string;
  description: string | null;
  amenities: string[];
  landmarks: Landmark[];
  images: string[];
  rules: string[];
  owner_phone: string | null;
  visit_fee_inr: number;
  is_active?: boolean;
  lat: number | null;
  lng: number | null;
  room_types: RoomType[];
  colleges?: { name: string } | null;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type FormState = { error?: string };
