import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, EmptyState } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { FileBadge, ShieldCheck, Wallet, Clock, AlertTriangle, Activity, FileX, Calendar } from "lucide-react";
import { formatRM, formatDateTime } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  valid: "hsl(var(--success))",
  revoked: "hsl(var(--destructive))",
  suspended: "hsl(var(--warning))",
  pending: "hsl(var(--muted-foreground))",
};

export default function UniDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, verified: 0, revenue: 0, monthRev: 0, pending: 0, revoked: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.university_id) return;
    (async () => {
      const uid = profile.university_id;
      const [allCerts, rev, p] = await Promise.all([
        supabase.from("certificates").select("certificate_status").eq("university_id", uid),
        supabase.from("transactions").select("university_share, paid_at, vr:verification_requests!inner(certificate:certificates!inner(university_id))").eq("vr.certificate.university_id", uid),
        supabase.from("verification_requests").select("id, certificate:certificates!inner(university_id)", { count: "exact", head: true }).eq("certificate.university_id", uid).eq("payment_status", "unpaid"),
      ]);
      const certs = (allCerts.data ?? []) as any[];
      const counts: Record<string, number> = {};
      certs.forEach((c) => { counts[c.certificate_status] = (counts[c.certificate_status] ?? 0) + 1; });
      setBreakdown(Object.entries(counts).map(([name, value]) => ({ name, value })));

      const txns = (rev.data ?? []) as any[];
      const totalRev = txns.reduce((s, t) => s + Number(t.university_share), 0);
      const now = new Date();
      const monthRev = txns.filter((t) => {
        const d = new Date(t.paid_at ?? Date.now());
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).reduce((s, t) => s + Number(t.university_share), 0);

      setStats({
        total: certs.length,
        verified: counts.valid ?? 0,
        revenue: totalRev,
        monthRev,
        pending: p.count ?? 0,
        revoked: counts.revoked ?? 0,
      });

      // 6-month revenue trend
      const months: Record<string, { month: string; revenue: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        months[k] = { month: k, revenue: 0 };
      }
      txns.forEach((t) => {
        const d = new Date(t.paid_at ?? Date.now());
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        if (months[k]) months[k].revenue += Number(t.university_share);
      });
      setTrend(Object.values(months));

      const { data: vr } = await supabase.from("verification_requests").select("*, certificate:certificates!inner(student_name, certificate_number, university_id)").eq("certificate.university_id", uid).order("created_at", { ascending: false }).limit(5);
      setRecent(vr ?? []);
      const { data: lg } = await supabase.from("api_logs").select("*").eq("university_id", uid).order("created_at", { ascending: false }).limit(5);
      setLogs(lg ?? []);
    })();
  }, [profile?.university_id]);

  return (
    <AppLayout title="University Overview" breadcrumbs={[{ label: "University" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Certificates" value={stats.total.toLocaleString()} icon={<FileBadge className="h-5 w-5" />} hint="Indexed records" />
        <StatCard label="Valid" value={stats.verified.toLocaleString()} icon={<ShieldCheck className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Revenue" value={formatRM(stats.revenue)} icon={<Wallet className="h-5 w-5" />} accent="success" />
        <StatCard label="This Month" value={formatRM(stats.monthRev)} icon={<Calendar className="h-5 w-5" />} hint="University share" />
        <StatCard label="Pending Payment" value={stats.pending} icon={<Clock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Revoked" value={stats.revoked} icon={<FileX className="h-5 w-5" />} accent="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue (last 6 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => formatRM(v as number)} />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Certificate status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {breakdown.length === 0 ? <EmptyState icon={<FileBadge className="h-5 w-5" />} title="No data" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {breakdown.map((b, i) => <Cell key={i} fill={STATUS_COLORS[b.name] ?? "hsl(var(--primary))"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Recent verifications</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? <EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="No verifications yet" description="Verifications by employers will appear here." /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.report_reference_no ?? "—"}</TableCell>
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
            {logs.length === 0 ? <EmptyState icon={<Activity className="h-5 w-5" />} title="No API activity" description="Sync your registrar to see API calls here." /> : (
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
