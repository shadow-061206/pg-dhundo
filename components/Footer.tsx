export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
        © {new Date().getFullYear()} PGdekho. Find a safe place to stay near your college.
      </div>
    </footer>
  );
}
