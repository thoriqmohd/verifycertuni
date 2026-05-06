import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Paginator, usePaged } from "@/components/Pagination";
import { EmptyState } from "@/components/StatCard";

export default function AdminTransactions() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase.from("transactions").select("*, vr:verification_requests(report_reference_no, certificate:certificates(student_name, university_id), company:companies(company_name))").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (status === "all" || r.payment_status === status) &&
    (q === "" || r.payment_reference?.toLowerCase().includes(q.toLowerCase()) ||
      r.vr?.report_reference_no?.toLowerCase().includes(q.toLowerCase()) ||
      r.vr?.company?.company_name?.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, status]);
  useEffect(() => { setPage(1); }, [q, status]);
  const { slice, pages, page: pg, total } = usePaged(filtered, page, 12);

  const exportCsv = () => {
    const header = "Reference,Amount,Platform Share,University Share,Gateway Fee,Status,Paid At\n";
    const body = filtered.map((r) => `${r.payment_reference},${r.amount},${r.platform_share},${r.university_share},${r.gateway_fee},${r.payment_status},${r.paid_at ?? ""}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("Transactions exported");
  };

  return (
    <AppLayout title="Transactions" breadcrumbs={[{ label: "Admin" }, { label: "Transactions" }]}>
      <Card><CardContent className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by reference or company..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="refunded">Refunded</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="h-5 w-5" />} title="No transactions yet" description="Successful verification payments will appear here." />
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead className="hidden md:table-cell">Report</TableHead><TableHead>Company</TableHead><TableHead>Amount</TableHead><TableHead className="hidden lg:table-cell">Platform</TableHead><TableHead className="hidden lg:table-cell">University</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Paid at</TableHead></TableRow></TableHeader>
                <TableBody>
                  {slice.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.payment_reference}</TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{t.vr?.report_reference_no}</TableCell>
                      <TableCell className="text-sm">{t.vr?.company?.company_name ?? "—"}</TableCell>
                      <TableCell className="font-medium tabular-nums">{formatRM(t.amount)}</TableCell>
                      <TableCell className="text-primary tabular-nums hidden lg:table-cell">{formatRM(t.platform_share)}</TableCell>
                      <TableCell className="text-success tabular-nums hidden lg:table-cell">{formatRM(t.university_share)}</TableCell>
                      <TableCell><StatusBadge status={t.payment_status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{formatDateTime(t.paid_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginator page={pg} pages={pages} total={total} onChange={setPage} />
          </>
        )}
      </CardContent></Card>
    </AppLayout>
  );
}
