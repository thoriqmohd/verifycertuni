import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, EmptyState } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Receipt, Wallet, FileBadge, ArrowRight, Inbox, Calendar, ShieldCheck } from "lucide-react";
import { formatRM, formatDateTime } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function EmployerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, paid: 0, spend: 0, monthSpend: 0, monthCount: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.company_id) return;
    (async () => {
      const cid = profile.company_id;
      const [v, p, t] = await Promise.all([
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("company_id", cid),
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("payment_status", "paid"),
        supabase.from("transactions").select("amount, paid_at, vr:verification_requests!inner(company_id)").eq("vr.company_id", cid),
      ]);
      const txns = (t.data ?? []) as any[];
      const spend = txns.reduce((s: number, r: any) => s + Number(r.amount), 0);
      const now = new Date();
      const thisMonth = txns.filter((r) => {
        const d = new Date(r.paid_at ?? Date.now());
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      setStats({
        total: v.count ?? 0,
        paid: p.count ?? 0,
        spend,
        monthSpend: thisMonth.reduce((s, r) => s + Number(r.amount), 0),
        monthCount: thisMonth.length,
      });

      // 6-month trend
      const months: Record<string, { month: string; spend: number; count: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        months[k] = { month: k, spend: 0, count: 0 };
      }
      txns.forEach((r) => {
        const d = new Date(r.paid_at ?? Date.now());
        const k = d.toLocaleDateString("en-MY", { month: "short" });
        if (months[k]) { months[k].spend += Number(r.amount); months[k].count += 1; }
      });
      setTrend(Object.values(months));

      const { data: r } = await supabase.from("verification_requests").select("*, certificate:certificates(student_name, certificate_number)").eq("company_id", cid).order("created_at", { ascending: false }).limit(5);
      setRecent(r ?? []);
    })();
  }, [profile?.company_id]);

  return (
    <AppLayout title="Employer Overview" breadcrumbs={[{ label: "Employer" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Verifications" value={stats.total} icon={<Search className="h-5 w-5" />} hint="All time" />
        <StatCard label="Paid Reports" value={stats.paid} icon={<FileBadge className="h-5 w-5" />} accent="success" hint="Available to download" />
        <StatCard label="Total Spend" value={formatRM(stats.spend)} icon={<Wallet className="h-5 w-5" />} hint="All time" />
        <StatCard label="This Month" value={formatRM(stats.monthSpend)} icon={<Calendar className="h-5 w-5" />} accent="warning" hint={`${stats.monthCount} verifications`} />
      </div>

      <Card className="mb-6 overflow-hidden border-0 shadow-[var(--shadow-elegant)]">
        <CardContent className="p-0">
          <div className="gradient-hero p-6 lg:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-primary-foreground">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider bg-white/10 rounded-full px-2.5 py-0.5 mb-2"><ShieldCheck className="h-3 w-3" /> Source-of-truth</div>
              <h2 className="text-xl lg:text-2xl font-bold mb-1">Verify a candidate's certificate</h2>
              <p className="text-primary-foreground/80 text-sm">Search by name, certificate number, IC or university.</p>
            </div>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/employer/search">Search Certificate <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Verification spend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs><linearGradient id="emp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => formatRM(v as number)} />
                  <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" fill="url(#emp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent verifications</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState icon={<Inbox className="h-5 w-5" />} title="No verifications yet" description="Search for a certificate to get started." action={<Button asChild><Link to="/employer/search">Search certificate</Link></Button>} />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.report_reference_no ?? "—"}</TableCell>
                      <TableCell className="text-sm truncate max-w-[140px]">{r.certificate?.student_name}</TableCell>
                      <TableCell><StatusBadge status={r.payment_status === "paid" ? "completed" : "pending"} /></TableCell>
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
