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
import { Search, Receipt, Wallet, FileBadge, ArrowRight, Inbox } from "lucide-react";
import { formatRM, formatDateTime } from "@/lib/format";

export default function EmployerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, paid: 0, spend: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.company_id) return;
    (async () => {
      const cid = profile.company_id;
      const [v, p, t] = await Promise.all([
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("company_id", cid),
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("company_id", cid).eq("payment_status", "paid"),
        supabase.from("transactions").select("amount, vr:verification_requests!inner(company_id)").eq("vr.company_id", cid),
      ]);
      const spend = (t.data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      setStats({ total: v.count ?? 0, paid: p.count ?? 0, spend });
      const { data: r } = await supabase.from("verification_requests").select("*, certificate:certificates(student_name, certificate_number)").eq("company_id", cid).order("created_at", { ascending: false }).limit(5);
      setRecent(r ?? []);
    })();
  }, [profile?.company_id]);

  return (
    <AppLayout title="Employer Overview" breadcrumbs={[{ label: "Employer" }, { label: "Dashboard" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Verifications" value={stats.total} icon={<Search className="h-5 w-5" />} />
        <StatCard label="Paid Reports" value={stats.paid} icon={<FileBadge className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Spend" value={formatRM(stats.spend)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Saved Candidates" value={stats.paid} icon={<Receipt className="h-5 w-5" />} />
      </div>

      <Card className="mb-6 bg-gradient-to-r from-primary to-primary/80 border-0">
        <CardContent className="p-6 flex items-center justify-between text-primary-foreground">
          <div><h2 className="text-xl font-bold mb-1">Verify a candidate's certificate</h2><p className="text-primary-foreground/80 text-sm">Search by name, certificate number, or IC.</p></div>
          <Button variant="secondary" asChild><Link to="/employer/search">Search Certificate <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent verifications</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? <EmptyState icon={<Inbox className="h-5 w-5" />} title="No verifications yet" description="Search for a certificate to get started." action={<Button asChild><Link to="/employer/search">Search certificate</Link></Button>} /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.report_reference_no ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.certificate?.student_name}</TableCell>
                    <TableCell><StatusBadge status={r.payment_status === "paid" ? "completed" : "pending"} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" asChild><Link to={r.payment_status === "paid" ? `/employer/report/${r.id}` : `/employer/payment/${r.id}`}>{r.payment_status === "paid" ? "View report" : "Pay"}</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
