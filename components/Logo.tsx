import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="text-2xl font-extrabold tracking-tight">
      <span className="text-[#a78bfa]">PG</span>
      <span className="text-white">dekho</span>
    </Link>
  );
}
