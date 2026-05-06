import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Wallet, Receipt, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatRM, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export default function UniRevenue() {
  const { profile } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);
  const [settles, setSettles] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.university_id) return;
    (async () => {
      const { data: t } = await supabase.from("transactions").select("*, vr:verification_requests!inner(report_reference_no, certificate:certificates!inner(student_name, university_id))").eq("vr.certificate.university_id", profile.university_id).order("created_at", { ascending: false });
      setTxns(t ?? []);
      const { data: s } = await supabase.from("settlements").select("*").eq("university_id", profile.university_id).order("created_at", { ascending: false });
      setSettles(s ?? []);
    })();
  }, [profile?.university_id]);

  const totalShare = txns.reduce((s, t) => s + Number(t.university_share), 0);
  const totalRev = txns.reduce((s, t) => s + Number(t.amount), 0);

  const exportCsv = () => {
    const header = "Reference,Student,Amount,University Share,Paid At\n";
    const body = txns.map((t) => `${t.payment_reference},${t.vr?.certificate?.student_name},${t.amount},${t.university_share},${t.paid_at ?? ""}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "revenue.csv"; a.click();
    toast.success("Exported");
  };

  return (
    <AppLayout title="Revenue" breadcrumbs={[{ label: "University" }, { label: "Revenue" }]}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Verifications" value={txns.length} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Gross Revenue" value={formatRM(totalRev)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="University Share" value={formatRM(totalShare)} icon={<BadgeDollarSign className="h-5 w-5" />} accent="success" />
        <StatCard label="Settlements" value={settles.length} icon={<BadgeDollarSign className="h-5 w-5" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center justify-between">Settlements<Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export</Button></CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Transactions</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Paid at</TableHead></TableRow></TableHeader>
            <TableBody>
              {settles.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.settlement_month}</TableCell>
                  <TableCell>{s.total_transactions}</TableCell>
                  <TableCell>{formatRM(s.total_amount)}</TableCell>
                  <TableCell><StatusBadge status={s.settlement_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(s.paid_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Your share</TableHead><TableHead>Status</TableHead><TableHead>Paid at</TableHead></TableRow></TableHeader>
            <TableBody>
              {txns.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.payment_reference}</TableCell>
                  <TableCell className="text-sm">{t.vr?.certificate?.student_name}</TableCell>
                  <TableCell>{formatRM(t.amount)}</TableCell>
                  <TableCell className="text-success font-medium">{formatRM(t.university_share)}</TableCell>
                  <TableCell><StatusBadge status={t.payment_status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(t.paid_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
