import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Inbox, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/StatCard";
import { Paginator, usePaged } from "@/components/Pagination";

export default function EmployerHistory() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [s, setS] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase.from("verification_requests").select("*, certificate:certificates(student_name, certificate_number, university:universities(name))").eq("company_id", profile.company_id).order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, [profile?.company_id]);

  const filtered = useMemo(() => rows.filter((r) =>
    (s === "all" || r.payment_status === s) &&
    (q === "" || r.certificate?.student_name?.toLowerCase().includes(q.toLowerCase()) || r.report_reference_no?.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, s]);

  useEffect(() => { setPage(1); }, [q, s]);
  const { slice, pages, page: pg, total } = usePaged(filtered, page, 10);

  return (
    <AppLayout title="Verification History" breadcrumbs={[{ label: "Employer" }, { label: "History" }]}>
      <Card><CardContent className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by name or reference..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={s} onValueChange={setS}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem></SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="No history yet" description="Your verification requests will appear here." action={<Button asChild><Link to="/employer/search">Search certificate</Link></Button>} />
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead className="hidden md:table-cell">University</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">When</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {slice.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.report_reference_no ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{r.certificate?.student_name}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{r.certificate?.university?.name}</TableCell>
                      <TableCell><StatusBadge status={r.payment_status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant={r.payment_status === "paid" ? "outline" : "default"} asChild><Link to={r.payment_status === "paid" ? `/employer/report/${r.id}` : `/employer/payment/${r.id}`}>{r.payment_status === "paid" ? <><Eye className="h-3.5 w-3.5 mr-1" />View</> : "Pay now"}</Link></Button></TableCell>
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
