import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function AdminTransactions() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("transactions").select("*, vr:verification_requests(report_reference_no, certificate:certificates(student_name, university_id), company:companies(company_name))").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  const exportCsv = () => {
    const header = "Reference,Amount,Platform Share,University Share,Gateway Fee,Status,Paid At\n";
    const body = rows.map((r) => `${r.payment_reference},${r.amount},${r.platform_share},${r.university_share},${r.gateway_fee},${r.payment_status},${r.paid_at ?? ""}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  return (
    <AppLayout title="Transactions" breadcrumbs={[{ label: "Admin" }, { label: "Transactions" }]}>
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex justify-end mb-3"><Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button></div>
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Report</TableHead><TableHead>Company</TableHead><TableHead>Amount</TableHead><TableHead>Platform</TableHead><TableHead>University</TableHead><TableHead>Status</TableHead><TableHead>Paid at</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.payment_reference}</TableCell>
                  <TableCell className="font-mono text-xs">{t.vr?.report_reference_no}</TableCell>
                  <TableCell className="text-sm">{t.vr?.company?.company_name ?? "—"}</TableCell>
                  <TableCell className="font-medium">{formatRM(t.amount)}</TableCell>
                  <TableCell className="text-primary">{formatRM(t.platform_share)}</TableCell>
                  <TableCell className="text-success">{formatRM(t.university_share)}</TableCell>
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
