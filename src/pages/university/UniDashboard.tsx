import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, EmptyState } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { FileBadge, ShieldCheck, Wallet, Clock, AlertTriangle, Activity, FileX } from "lucide-react";
import { formatRM, formatDateTime } from "@/lib/format";

export default function UniDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, verified: 0, revenue: 0, pending: 0, revoked: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.university_id) return;
    (async () => {
      const uid = profile.university_id;
      const [c, v, rev, p, r] = await Promise.all([
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("university_id", uid),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("university_id", uid).eq("certificate_status", "valid"),
        supabase.from("transactions").select("university_share, vr:verification_requests!inner(certificate:certificates!inner(university_id))").eq("vr.certificate.university_id", uid),
        supabase.from("verification_requests").select("id, certificate:certificates!inner(university_id)", { count: "exact", head: true }).eq("certificate.university_id", uid).eq("payment_status", "unpaid"),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("university_id", uid).eq("certificate_status", "revoked"),
      ]);
      const totalRev = (rev.data ?? []).reduce((s: number, t: any) => s + Number(t.university_share), 0);
      setStats({ total: c.count ?? 0, verified: v.count ?? 0, revenue: totalRev, pending: p.count ?? 0, revoked: r.count ?? 0 });

      const { data: vr } = await supabase.from("verification_requests").select("*, certificate:certificates!inner(student_name, certificate_number, university_id)").eq("certificate.university_id", uid).order("created_at", { ascending: false }).limit(5);
      setRecent(vr ?? []);
      const { data: lg } = await supabase.from("api_logs").select("*").eq("university_id", uid).order("created_at", { ascending: false }).limit(5);
      setLogs(lg ?? []);
    })();
  }, [profile?.university_id]);

  return (
    <AppLayout title="University Overview" breadcrumbs={[{ label: "University" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Certificates" value={stats.total} icon={<FileBadge className="h-5 w-5" />} />
        <StatCard label="Valid" value={stats.verified} icon={<ShieldCheck className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Revenue" value={formatRM(stats.revenue)} icon={<Wallet className="h-5 w-5" />} accent="success" />
        <StatCard label="Pending Payment" value={stats.pending} icon={<Clock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Revoked" value={stats.revoked} icon={<FileX className="h-5 w-5" />} accent="destructive" />
        <StatCard label="API Status" value="Online" icon={<Activity className="h-5 w-5" />} accent="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Recent verifications</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? <EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="No verifications yet" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.report_reference_no}</TableCell>
                      <TableCell className="text-sm">{r.certificate?.student_name}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent API logs</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? <EmptyState icon={<Activity className="h-5 w-5" />} title="No API activity" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Endpoint</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.endpoint}</TableCell>
                      <TableCell><span className="text-xs font-medium">{l.method}</span></TableCell>
                      <TableCell><span className={`text-xs font-medium ${l.response_status >= 400 ? "text-destructive" : "text-success"}`}>{l.response_status}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
