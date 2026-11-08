const styles: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold capitalize ${styles[status] ?? styles.cancelled}`}>{status}</span>
  );
}
