export const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

export const minPrice = (rooms: { price: number }[]) =>
  rooms.length ? Math.min(...rooms.map((r) => r.price)) : null;

export const genderLabel = (g: string) => (g === "boys" ? "Boys" : g === "girls" ? "Girls" : "Unisex");

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";
