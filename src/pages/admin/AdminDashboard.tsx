import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, EmptyState } from "@/components/StatCard";
import { Building2, FileBadge, Search, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDateTime } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ universities: 0, certificates: 0, verifications: 0, revenue: 0, pending: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [unis, setUnis] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [u, c, v, t, p] = await Promise.all([
        supabase.from("universities").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("verification_requests").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("amount,paid_at,university_share,platform_share"),
        supabase.from("universities").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const totalRev = (t.data ?? []).reduce((s, r: any) => s + Number(r.amount), 0);
      setStats({ universities: u.count ?? 0, certificates: c.count ?? 0, verifications: v.count ?? 0, revenue: totalRev, pending: p.count ?? 0 });

      // monthly trend - last 6 months
      const months: Record<string, { month: string; revenue: number; verifications: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        months[k] = { month: k, revenue: 0, verifications: 0 };
      }
      (t.data ?? []).forEach((r: any) => {
        const d = new Date(r.paid_at ?? Date.now());
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        if (months[k]) { months[k].revenue += Number(r.amount); months[k].verifications += 1; }
      });
      setTrend(Object.values(months));

      const { data: recentVR } = await supabase.from("verification_requests").select("*, certificate:certificates(student_name, certificate_number), company:companies(company_name)").order("created_at", { ascending: false }).limit(5);
      setRecent(recentVR ?? []);
      const { data: rt } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(5);
      setTxns(rt ?? []);
      const { data: ru } = await supabase.from("universities").select("*").order("created_at", { ascending: false }).limit(5);
      setUnis(ru ?? []);
    })();
  }, []);

  return (
    <AppLayout title="Overview" breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label="Universities" value={stats.universities} icon={<Building2 className="h-5 w-5" />} hint="Active partners" />
        <StatCard label="Certificates" value={stats.certificates.toLocaleString()} icon={<FileBadge className="h-5 w-5" />} hint="Indexed" />
        <StatCard label="Verifications" value={stats.verifications.toLocaleString()} icon={<Search className="h-5 w-5" />} accent="success" hint="All time" />
        <StatCard label="Total Revenue" value={formatRM(stats.revenue)} icon={<Wallet className="h-5 w-5" />} accent="success" />
        <StatCard label="Pending Approvals" value={stats.pending} icon={<AlertCircle className="h-5 w-5" />} accent="warning" hint="Universities awaiting review" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Verification trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="verifications" stroke="hsl(var(--primary))" fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue (RM)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Recent verification requests</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? <EmptyState icon={<Search className="h-5 w-5" />} title="No requests yet" /> : (
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
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent>
            {txns.length === 0 ? <EmptyState icon={<Wallet className="h-5 w-5" />} title="No transactions yet" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Amount</TableHead><TableHead>Paid at</TableHead></TableRow></TableHeader>
                <TableBody>
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.payment_reference}</TableCell>
                      <TableCell>{formatRM(t.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(t.paid_at)}</TableCell>
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
