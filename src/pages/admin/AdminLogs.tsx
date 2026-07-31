import { useEffect, useState } from "react";
import { AdminSectionHeader } from "@/components/admin/AdminUI";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

interface LogRow {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <AdminSectionHeader title="System Logs" description="An audit trail of automated and administrative actions (payments, confirmations, etc.)." />

      <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-forest-900/10 text-xs uppercase tracking-wide text-forest-900/40">
            <tr><th className="px-5 py-4">Action</th><th className="px-5 py-4">Entity</th><th className="px-5 py-4">Details</th><th className="px-5 py-4">Time</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-forest-900/40">Loading logs…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-forest-900/40">No system events recorded yet — they will appear here as bookings are confirmed and admin actions are taken.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-forest-900/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-forest-900">{l.action.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 text-forest-900/60">{l.entity ?? "—"}</td>
                  <td className="px-5 py-3 max-w-md truncate text-xs text-forest-900/40">{JSON.stringify(l.metadata)}</td>
                  <td className="px-5 py-3 text-forest-900/40">{formatDate(l.created_at, { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
